// src/pages/InventoryDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
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

const TAB_VALUES = [
  { value: "items", label: "Items" },
  { value: "chat", label: "Chat" },
  { value: "settings", label: "Settings" },
  { value: "custom-id", label: "Custom ID" },
  { value: "fields", label: "Fields" },
  { value: "access", label: "Access" },
  { value: "stats", label: "Stats" },
  { value: "export", label: "Export" },
];

export default function InventoryDetails() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [inventory, setInventory] = useState(null);

  const activeTab = useMemo(() => {
    const t = searchParams.get("tab");
    return TAB_VALUES.some((x) => x.value === t) ? t : "items";
  }, [searchParams]);

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
        if (!dead) setError(e?.message || "Failed to load");
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [id]);

  // Пример значений для предпросмотра блока "Поле" в Custom ID
  const sampleFields = useMemo(() => ({
    brand: "ACME",
    model: "Z-500",
    year: "2025",
  }), []);

  async function handleSaveFields(nextFields) {
    if (!inventory?._id) return;
    setSaving(true);
    setError("");
    try {
      const updated = await inventoryService.update(inventory._id, { fields: nextFields });
      setInventory((prev) => ({ ...(prev || {}), fields: updated.fields || nextFields }));
      // (убрано) alert("Поля сохранены");
    } catch (e) {
      setError(e?.message || "Не удалось сохранить поля");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCustomId(nextCfg) {
    if (!inventory?._id) return;
    setSaving(true);
    setError("");
    try {
      const updated = await inventoryService.update(inventory._id, { customIdFormat: nextCfg });
      setInventory((prev) => ({ ...(prev || {}), customIdFormat: updated.customIdFormat || nextCfg }));
      // (убрано) alert("Custom ID сохранён");
    } catch (e) {
      setError(e?.message || "Не удалось сохранить Custom ID");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/inventories" className="text-sm text-blue-600 hover:underline">
            &larr; All inventories
          </Link>
          {inventory && <div className="text-xl font-semibold">{inventory.name || "Untitled inventory"}</div>}
        </div>
        <div className="text-sm opacity-70">
          {saving ? "Saving…" : loading ? "Loading…" : null}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <Tabs tabs={TAB_VALUES} value={activeTab} onChange={setTab} />

      {loading ? (
        <div className="mt-6 text-sm opacity-70">Loading inventory…</div>
      ) : !inventory ? (
        <div className="mt-6 text-sm text-red-700">Inventory not found.</div>
      ) : (
        <div className="mt-6">
          {activeTab === "items" && <ItemsTab inventory={inventory} />}
          {activeTab === "chat" && <ChatTab inventory={inventory} />}
          {activeTab === "settings" && <SettingsTab inventory={inventory} />}

          {activeTab === "custom-id" && (
            <CustomIdTab
              value={inventory.customIdFormat || { enabled: true, separator: "-", elements: [] }}
              onChange={(cfg) => setInventory((prev) => ({ ...(prev || {}), customIdFormat: cfg }))}
              onSave={handleSaveCustomId}
              disabled={saving}
              sampleFields={sampleFields}
              inventory={inventory}
            />
          )}

          {activeTab === "fields" && (
            <FieldsTab
              value={inventory.fields || []}
              onChange={(next) => setInventory((prev) => ({ ...(prev || {}), fields: next }))}
              onSave={handleSaveFields}
              disabled={saving}
              inventory={inventory}
            />
          )}

          {activeTab === "access" && <AccessTab inventory={inventory} />}
          {activeTab === "stats" && <StatsTab inventory={inventory} />}
          {activeTab === "export" && <ExportTab inventory={inventory} />}
        </div>
      )}
    </div>
  );
}
