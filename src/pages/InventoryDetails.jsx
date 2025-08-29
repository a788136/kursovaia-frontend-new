// src/pages/InventoryDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getInventoryById } from "../services/inventories";
import { inventoryService } from "../services/inventoryService";
import Tabs from "../components/ui/Tabs";
import ItemsTab from "../components/inventory/ItemsTab";
import ChatTab from "../components/inventory/ChatTab";
import SettingsTab from "../components/inventory/SettingsTab";
import CustomIdTab from "../components/inventory/CustomIdTab";
import FieldsTab from "../components/inventory/FieldsTab";
import AccessTab from "../components/inventory/AccessTab";
import StatsTab from "../components/inventory/StatsTab";
import ExportTab from "../components/inventory/ExportTab";

const DICT = {
  ru: {
    tabs: {
      items: "Элементы",
      chat: "Чат",
      settings: "Настройки",
      customId: "Кастомный ID",
      fields: "Поля",
      access: "Доступ",
      stats: "Статистика",
      export: "Экспорт",
    },
    back: "← Все инвентаризации",
    untitled: "Без названия",
    saving: "Сохранение…",
    loading: "Загрузка…",
    loadingInventory: "Загрузка инвентаризации…",
    notFound: "Инвентаризация не найдена.",
    errors: {
      loadFailed: "Не удалось загрузить",
      saveFieldsFailed: "Не удалось сохранить поля",
      saveCustomIdFailed: "Не удалось сохранить Custom ID",
    },
  },
  en: {
    tabs: {
      items: "Items",
      chat: "Chat",
      settings: "Settings",
      customId: "Custom ID",
      fields: "Fields",
      access: "Access",
      stats: "Stats",
      export: "Export",
    },
    back: "← All inventories",
    untitled: "Untitled inventory",
    saving: "Saving…",
    loading: "Loading…",
    loadingInventory: "Loading inventory…",
    notFound: "Inventory not found.",
    errors: {
      loadFailed: "Failed to load",
      saveFieldsFailed: "Failed to save fields",
      saveCustomIdFailed: "Failed to save Custom ID",
    },
  },
};

export default function InventoryDetails({ user, lang: langProp }) {
  const lang = (langProp || localStorage.getItem("lang") || "ru")
    .toLowerCase()
    .startsWith("en")
    ? "en"
    : "ru";
  const L = DICT[lang];

  const TAB_VALUES = useMemo(
    () => [
      { value: "items", label: L.tabs.items },
      { value: "chat", label: L.tabs.chat },
      { value: "settings", label: L.tabs.settings },
      { value: "custom-id", label: L.tabs.customId },
      { value: "fields", label: L.tabs.fields },
      { value: "access", label: L.tabs.access },
      { value: "stats", label: L.tabs.stats },
      { value: "export", label: L.tabs.export },
    ],
    [L]
  );

  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [inventory, setInventory] = useState(null);

  const activeTab = useMemo(() => {
    const t = searchParams.get("tab");
    return TAB_VALUES.some((x) => x.value === t) ? t : "items";
  }, [searchParams, TAB_VALUES]);

  function setTab(value) {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const inv = await getInventoryById(id);
        if (!dead) setInventory(inv);
      } catch (e) {
        if (!dead) setError(e?.message || L.errors.loadFailed);
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, [id, L.errors.loadFailed]);

  const sampleFields = useMemo(
    () => ({ brand: "ACME", model: "Z-500", year: "2025" }),
    []
  );

  async function handleSaveFields(nextFields) {
    if (!inventory?._id) return;
    setSaving(true);
    setError("");
    try {
      const updated = await inventoryService.update(inventory._id, {
        fields: nextFields,
      });
      setInventory((prev) => ({
        ...(prev || {}),
        fields: updated?.fields ?? nextFields,
      }));
    } catch (e) {
      setError(e?.message || L.errors.saveFieldsFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCustomId(nextCfg) {
    if (!inventory?._id) return;
    setSaving(true);
    setError("");
    try {
      await inventoryService.update(inventory._id, { customIdFormat: nextCfg });
    } catch (e) {
      setError(e?.message || L.errors.saveCustomIdFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="id-page container mx-auto max-w-6xl px-4 py-6 overflow-x-hidden">
      {/* Локальные стили: без горизонтального скролла и полностью видимые табы на мобильном */}
      <style>{`
        .id-page { max-width: 100%; }
        .id-page * { box-sizing: border-box; }

        .id-page .title-wrap { min-width: 0; }
        .id-page .title { word-break: break-word; overflow-wrap: anywhere; }

        /* На всякий случай убираем любые горизонтальные скроллы вокруг табов */
        .id-page .tabs-wrap,
        .id-page .tabs-wrap * {
          max-width: 100%;
        }
        .id-page .tabs-wrap {
          overflow-x: visible !important;
        }

        /* По умолчанию не трогаем десктопный вид табов */
        /* --- Мобильная компоновка табов --- */
        @media (max-width: 640px) {
          /* Переводим tablist в сетку без скролла */
          .id-page .tabs-wrap [role="tablist"] {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: .5rem;
            padding: .25rem 0;
            overflow-x: visible !important;
            width: 100%;
          }
          /* Если у табов есть внутренние классы с min-width/whitespace-nowrap — ломаем их */
          .id-page .tabs-wrap [role="tab"] {
            min-width: 0 !important;
            white-space: normal !important;
            word-break: break-word;
            text-align: center;
            line-height: 1.2;
          }
          /* Частый случай: сами табы — button/a без роли */
          .id-page .tabs-wrap button,
          .id-page .tabs-wrap a {
            min-width: 0 !important;
            white-space: normal !important;
            word-break: break-word;
            text-align: center;
            line-height: 1.2;
          }

          /* Шапка складывается столбиком */
          .id-page .head {
            flex-direction: column;
            align-items: flex-start;
            gap: .25rem;
          }
          .id-page .status {
            align-self: stretch;
            text-align: left;
          }
        }
      `}</style>

      <div className="mb-4 head flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 title-wrap">
          {inventory && (
            <div className="title text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {inventory.name || (lang === "ru" ? L.untitled : L.untitled)}
            </div>
          )}
        </div>
        <div className="status text-sm opacity-70">
          {saving ? L.saving : loading ? L.loading : null}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {/* Враппер для надёжного переопределения поведения табов на мобильном */}
      <div className="tabs-wrap">
        <Tabs tabs={TAB_VALUES} value={activeTab} onChange={setTab} />
      </div>

      {loading ? (
        <div className="mt-6 text-sm opacity-70">{L.loadingInventory}</div>
      ) : !inventory ? (
        <div className="mt-6 text-sm text-red-700">{L.notFound}</div>
      ) : (
        <div className="mt-6">
          {activeTab === "items" && <ItemsTab inventory={inventory} />}
          {activeTab === "chat" && <ChatTab inventory={inventory} user={user} />}
          {activeTab === "settings" && <SettingsTab inventory={inventory} />}

          {activeTab === "custom-id" && (
            <CustomIdTab
              lang={lang}
              value={
                inventory.customIdFormat || {
                  enabled: true,
                  separator: "-",
                  elements: [],
                }
              }
              onChange={(cfg) =>
                setInventory((prev) => ({
                  ...(prev || {}),
                  customIdFormat: cfg,
                }))
              }
              onSave={handleSaveCustomId}
              disabled={saving}
              sampleFields={sampleFields}
              inventory={inventory}
            />
          )}

          {activeTab === "fields" && (
            <FieldsTab
              value={inventory.fields || []}
              onChange={(next) =>
                setInventory((prev) => ({ ...(prev || {}), fields: next }))
              }
              onSave={handleSaveFields}
              disabled={saving}
              inventory={inventory}
            />
          )}

          {/* user передаём — чтобы владелец/админ мог назначать доступы */}
          {activeTab === "access" && (
            <AccessTab inventory={inventory} user={user} />
          )}

          {activeTab === "stats" && <StatsTab inventory={inventory} />}
          {activeTab === "export" && <ExportTab inventory={inventory} />}
        </div>
      )}
    </div>
  );
}
