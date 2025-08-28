// src/pages/ProfilePage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';
import http from '../api/http';

function normalize(inv) {
  if (!inv || typeof inv !== 'object') return inv;
  return {
    _id: String(inv._id || inv.id || ''),
    name: inv.name || inv.title || '',
    description: inv.description || '',
    cover: inv.cover || inv.image || null,
    tags: Array.isArray(inv.tags) ? inv.tags : [],
    owner: inv.owner ?? null,
    owner_id: inv.owner_id ?? (typeof inv.owner === 'string' ? inv.owner : undefined),
    createdAt: inv.createdAt || inv.created_at || null,
    updatedAt: inv.updatedAt || inv.updated_at || null,
  };
}

function formatDate(row, locale) {
  const d = row.updatedAt || row.createdAt;
  return d ? new Date(d).toLocaleDateString(locale) : '—';
}

function formatAuthor(row) {
  // Пытаемся показать имя и фамилию владельца.
  // Поддерживаем разные варианты: name | firstName/lastName | displayName | email | username.
  if (row && typeof row.owner === 'object' && row.owner) {
    const o = row.owner;
    const parts = [];
    if (o.firstName) parts.push(o.firstName);
    if (o.lastName) parts.push(o.lastName);
    const fnln = parts.join(' ').trim();
    if (o.name && o.name.trim()) return o.name.trim();
    if (fnln) return fnln;
    if (o.displayName && o.displayName.trim()) return o.displayName.trim();
    if (o.username && o.username.trim()) return o.username.trim();
    if (o.email && o.email.trim()) return o.email.trim();
  }
  if (row?.owner_id) return String(row.owner_id);
  if (typeof row?.owner === 'string') return row.owner;
  return '—';
}

/** «Таблица» на div-ах, как на главной */
function ListSection({ title, items, emptyText, navigate, t, locale }) {
  const GRID_COLS = '4rem 2fr 1.2fr 3fr 1.1fr';

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* header */}
        <div
          role="row"
          className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur dark:bg-gray-900/95 px-4 py-3 text-sm font-semibold"
          style={{ display: 'grid', gridTemplateColumns: GRID_COLS }}
        >
          <div role="columnheader" className="text-left">{t.columns.image}</div>
          <div role="columnheader" className="text-left">{t.columns.name}</div>
          <div role="columnheader" className="text-left">{t.columns.owner}</div>
          <div role="columnheader" className="text-left hidden md:block">{t.columns.description}</div>
          <div role="columnheader" className="text-left">{t.columns.updated}</div>
        </div>

        {/* rows */}
        <div role="rowgroup">
          {items?.length ? items.map((row) => (
            <div
              key={row._id}
              role="row"
              onClick={() => navigate(`/inventories/${row._id}`)}
              className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer border-t border-gray-100 dark:border-gray-800"
              style={{ display: 'grid', gridTemplateColumns: GRID_COLS, alignItems: 'center' }}
              title={row.name || t.noName}
            >
              {/* cover */}
              <div role="cell" className="py-1">
                {row.cover ? (
                  <img
                    src={row.cover}
                    alt=""
                    className="h-10 w-10 object-cover rounded-md border"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-md border flex items-center justify-center text-xs text-gray-400">
                    —
                  </div>
                )}
              </div>

              {/* name */}
              <div role="cell" className="font-medium truncate pr-2">
                {row.name || t.noName}
              </div>

              {/* owner */}
              <div role="cell" className="truncate pr-2">
                {formatAuthor(row)}
              </div>

              {/* description */}
              <div role="cell" className="text-gray-600 dark:text-gray-400 hidden md:block pr-4">
                {row.description
                  ? (row.description.length > 140
                      ? row.description.slice(0, 140) + '…'
                      : row.description)
                  : '—'}
              </div>

              {/* updated */}
              <div role="cell" className="whitespace-nowrap text-gray-700 dark:text-gray-300">
                {formatDate(row, locale)}
              </div>
            </div>
          )) : (
            <div className="px-4 py-10 text-center text-gray-500">
              {emptyText}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ProfilePage({ user, lang = 'ru' }) {
  const navigate = useNavigate();

  const [mine, setMine] = useState([]);
  const [mineLoading, setMineLoading] = useState(false);
  const [mineError, setMineError] = useState('');

  const [writable, setWritable] = useState([]);
  const [writableLoading, setWritableLoading] = useState(false);
  const [writableError, setWritableError] = useState('');

  // i18n
  const tMap = useMemo(() => ({
    ru: {
      titleMy: 'Мои инвентаризации',
      titleWrite: 'Доступ на запись',
      loadingMine: 'Загрузка ваших инвентаризаций…',
      loadingWrite: 'Загрузка инвентаризаций с доступом на запись…',
      emptyMine: 'Вы ещё не создали ни одной инвентаризации.',
      emptyWrite: 'Нет инвентаризаций, где вам выдали доступ на запись.',
      noUser: 'Нет данных пользователя.',
      noName: 'Без названия',
      columns: {
        image: 'Картинка',
        name: 'Название',
        owner: 'Автор',
        description: 'Описание',
        updated: 'Обновлено',
      },
      errors: {
        mine: 'Не удалось загрузить ваши инвентаризации',
        write: 'Не удалось загрузить инвентаризации с доступом на запись',
      },
      locale: 'ru-RU',
    },
    en: {
      titleMy: 'My inventories',
      titleWrite: 'Write access',
      loadingMine: 'Loading your inventories…',
      loadingWrite: 'Loading inventories with write access…',
      emptyMine: "You haven't created any inventories yet.",
      emptyWrite: 'No inventories where you have write access.',
      noUser: 'No user data.',
      noName: 'Untitled',
      columns: {
        image: 'Image',
        name: 'Name',
        owner: 'Owner',
        description: 'Description',
        updated: 'Updated',
      },
      errors: {
        mine: 'Failed to load your inventories',
        write: 'Failed to load write-access inventories',
      },
      locale: 'en-US',
    },
  }), []);

  const t = tMap[lang] || tMap.ru;
  const locale = t.locale || 'ru-RU';

  // Загрузка "Мои инвентаризации" — ТЕПЕРЬ по owner=me
  useEffect(() => {
    let dead = false;
    (async () => {
      if (!user) return;
      setMineLoading(true);
      setMineError('');
      try {
        const res = await inventoryService.getAll({ owner: 'me', limit: 100 });
        const list = Array.isArray(res) ? res : (res?.items ?? []);
        if (!dead) setMine(list.map(normalize));
      } catch (e) {
        if (!dead) setMineError(e?.message || t.errors.mine);
      } finally {
        if (!dead) setMineLoading(false);
      }
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Загрузка "Инвентаризации с write-доступом" — без своих (excludeOwner=true)
  useEffect(() => {
    let dead = false;

    async function loadWritable() {
      if (!user) return;
      setWritableLoading(true);
      setWritableError('');
      try {
        let data = null;

        // Вариант A: /access/my?type=write&excludeOwner=true
        try {
          const resp = await http.get('/access/my', { params: { type: 'write', excludeOwner: true } });
          data = resp.data;
        } catch {}

        // Вариант B (fallback): /inventory-access/my?type=write&excludeOwner=true
        if (!data) {
          try {
            const resp = await http.get('/inventory-access/my', { params: { type: 'write', excludeOwner: true } });
            data = resp.data;
          } catch {}
        }

        // Вариант C (fallback): /inventories?access=write&excludeOwner=true
        if (!data) {
          try {
            const resp = await http.get('/inventories', { params: { access: 'write', excludeOwner: true, limit: 100 } });
            data = resp.data;
          } catch {}
        }

        let rows = [];
        if (data) {
          if (Array.isArray(data.items) && data.items.length && (data.items[0].title || data.items[0].name || data.items[0]._id)) {
            rows = data.items;
          } else if (Array.isArray(data.items)) {
            const withDocs = data.items.map((x) => x.inventory).filter(Boolean);
            rows = withDocs;

            const ids = data.items
              .map((x) => x.inventoryId || x.inventory_id)
              .filter(Boolean)
              .map(String);

            const needFetch = ids.filter(id => !withDocs.some(doc => String(doc?._id) === id));
            if (needFetch.length) {
              const uniq = Array.from(new Set(needFetch));
              const fetched = await Promise.all(
                uniq.map(id => http.get(`/inventories/${id}`).then(r => r.data).catch(() => null))
              );
              rows = rows.concat(fetched.filter(Boolean));
            }
          }
        }

        if (!data) {
          throw new Error('Эндпойнт списка write-доступов не найден');
        }

        if (!dead) setWritable((rows || []).map(normalize));
      } catch (e) {
        if (!dead) {
          setWritable([]);
          setWritableError(e?.message || t.errors.write);
        }
      } finally {
        if (!dead) setWritableLoading(false);
      }
    }

    loadWritable();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
        <h1 className="text-2xl font-semibold mb-2">Профиль</h1>
        <p className="text-gray-600 dark:text-gray-400">{t.noUser}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Мои инвентаризации */}
      <div className="space-y-2">
        {mineLoading && <div className="text-sm text-gray-500">{t.loadingMine}</div>}
        {!!mineError && <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-800 text-sm">{mineError}</div>}
        <ListSection
          title={t.titleMy}
          items={mine}
          emptyText={t.emptyMine}
          navigate={navigate}
          t={t}
          locale={locale}
        />
      </div>

      {/* Инвентаризации с write-доступом */}
      <div className="space-y-2">
        {writableLoading && <div className="text-sm text-gray-500">{t.loadingWrite}</div>}
        {!!writableError && <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-800 text-sm">{writableError}</div>}
        <ListSection
          title={t.titleWrite}
          items={writable}
          emptyText={t.emptyWrite}
          navigate={navigate}
          t={t}
          locale={locale}
        />
      </div>
    </div>
  );
}
