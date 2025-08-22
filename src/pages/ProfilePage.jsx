// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';
import http from '../api/http';

function normalize(inv) {
  if (!inv || typeof inv !== 'object') return inv;
  return {
    _id: String(inv._id || inv.id || ''),
    name: inv.name || inv.title || 'Без названия',
    description: inv.description || '',
    cover: inv.cover || inv.image || null,
    tags: Array.isArray(inv.tags) ? inv.tags : [],
    owner: inv.owner ?? null,
    owner_id: inv.owner_id ?? (typeof inv.owner === 'string' ? inv.owner : undefined),
    createdAt: inv.createdAt || inv.created_at || null,
    updatedAt: inv.updatedAt || inv.updated_at || null,
  };
}

function formatDate(row) {
  const d = row.updatedAt || row.createdAt;
  return d ? new Date(d).toLocaleDateString() : '—';
}

function formatAuthor(row) {
  if (typeof row.owner === 'object' && row.owner?.name) return row.owner.name;
  if (row.owner_id) return String(row.owner_id);
  if (typeof row.owner === 'string') return row.owner;
  return '—';
}

/** «Таблица» на div-ах, как на главной */
function ListSection({ title, items, emptyText, navigate }) {
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
          <div role="columnheader" className="text-left">Картинка</div>
          <div role="columnheader" className="text-left">Название</div>
          <div role="columnheader" className="text-left">Автор</div>
          <div role="columnheader" className="text-left hidden md:block">Описание</div>
          <div role="columnheader" className="text-left">Обновлено</div>
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
              title={row.name || 'Inventory'}
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
                {row.name || '—'}
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
                {formatDate(row)}
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

export default function ProfilePage({ user }) {
  const navigate = useNavigate();

  const [mine, setMine] = useState([]);
  const [mineLoading, setMineLoading] = useState(false);
  const [mineError, setMineError] = useState('');

  const [writable, setWritable] = useState([]);
  const [writableLoading, setWritableLoading] = useState(false);
  const [writableError, setWritableError] = useState('');

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
        if (!dead) setMineError(e?.message || 'Не удалось загрузить ваши инвентаризации');
      } finally {
        if (!dead) setMineLoading(false);
      }
    })();
    return () => { dead = true; };
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
          setWritableError(e?.message || 'Не удалось загрузить инвентаризации с доступом на запись');
        }
      } finally {
        if (!dead) setWritableLoading(false);
      }
    }

    loadWritable();
    return () => { dead = true; };
  }, [user]);

  if (!user) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
        <h1 className="text-2xl font-semibold mb-2">Профиль</h1>
        <p className="text-gray-600 dark:text-gray-400">Нет данных пользователя.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Профиль */}
      {/* <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
        <h1 className="text-2xl font-semibold mb-4">Привет, {user.name}!</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div>Email: <span className="font-medium">{user.email}</span></div>
          <div>Язык: <span className="font-medium">{user.lang}</span></div>
          <div>Тема: <span className="font-medium">{user.theme}</span></div>
          <div>Создан: {new Date(user.createdAt).toLocaleString()}</div>

          {Array.isArray(user.roles) && user.roles.length > 0 && (
            <div className="mt-4">
              <div className="mb-1 opacity-70">Роли</div>
              <div className="flex flex-wrap gap-2">
                {user.roles.map((r) => (
                  <span key={r} className="rounded-full border px-2 py-0.5 text-xs capitalize">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div> */}

      {/* Мои инвентаризации */}
      <div className="space-y-2">
        {mineLoading && <div className="text-sm text-gray-500">Загрузка ваших инвентаризаций…</div>}
        {!!mineError && <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-800 text-sm">{mineError}</div>}
        <ListSection
          title="Мои инвентаризации"
          items={mine}
          emptyText="Вы ещё не создали ни одной инвентаризации."
          navigate={navigate}
        />
      </div>

      {/* Инвентаризации с write-доступом */}
      <div className="space-y-2">
        {writableLoading && <div className="text-sm text-gray-500">Загрузка инвентаризаций с доступом на запись…</div>}
        {!!writableError && <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-800 text-sm">{writableError}</div>}
        <ListSection
          title="Доступ на запись"
          items={writable}
          emptyText="Нет инвентаризаций, где вам выдали доступ на запись."
          navigate={navigate}
        />
      </div>
    </div>
  );
}
