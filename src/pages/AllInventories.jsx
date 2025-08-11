// src/pages/AllInventories.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';
import InventoryForm from '../components/InventoryForm';
import Modal from '../components/Modal';

/* ================= i18n ================= */
const MESSAGES = {
  ru: {
    title: 'Инвентаризации',
    searchPlaceholder: 'Поиск (название, автор, тег)…',
    create: 'Создать',
    creating: 'Создаём…',
    loading: 'Загрузка…',
    errorLoading: 'Не удалось загрузить инвентаризации',
    empty: 'Ничего не найдено',
    sortBy: 'Сортировка',
    name: 'Название',
    owner: 'Автор',
    description: 'Описание',
    updated: 'Обновлено',
    created: 'Создано',
    image: 'Картинка',
  },
  en: {
    title: 'Inventories',
    searchPlaceholder: 'Search (name, owner, tag)…',
    create: 'Create',
    creating: 'Creating…',
    loading: 'Loading…',
    errorLoading: 'Failed to load inventories',
    empty: 'Nothing found',
    sortBy: 'Sort',
    name: 'Name',
    owner: 'Owner',
    description: 'Description',
    updated: 'Updated',
    created: 'Created',
    image: 'Image',
  },
};

function useI18n(langProp, tProp) {
  const lang = (langProp || localStorage.getItem('lang') || 'ru')
    .toLowerCase()
    .startsWith('en') ? 'en' : 'ru';

  const fallbackT = (key) => MESSAGES[lang]?.[key] ?? key;
  const t = (key) => {
    const fromApp = tProp?.[lang]?.[key];
    return fromApp ?? fallbackT(key);
  };

  return { lang, t };
}

/* ================ helpers ================ */

// JWT (если позже переключишься на контекст — замени здесь)
function getToken() {
  try { return localStorage.getItem('token') || ''; } catch { return ''; }
}

// Нормализация записи
function normalizeInventory(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const ownerName =
    typeof raw.owner === 'object' && raw.owner?.name ? raw.owner.name : undefined;

  return {
    _id: raw._id || raw.id || raw._id?.$oid || '',
    name: raw.name || raw.title || 'Без названия',
    description: raw.description || raw.desc || '',
    cover: raw.cover || raw.image || raw.imageUrl || null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    owner: raw.owner ?? null,
    owner_id: raw.owner_id ?? (typeof raw.owner === 'string' ? raw.owner : undefined),
    ownerName,
    createdAt: raw.createdAt || raw.created_at || null,
    updatedAt: raw.updatedAt || raw.updated_at || null,
    ...raw,
  };
}

function formatAuthor(row) {
  if (typeof row.owner === 'object' && row.owner?.name) return row.owner.name;
  if (row.owner_id) return String(row.owner_id);
  if (typeof row.owner === 'string') return row.owner;
  return '—';
}

function SortHeader({ active, dir, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 select-none ${className}`}
      title="Sort"
    >
      <span>{children}</span>
      <span className={`text-xs opacity-70 transition-transform ${active ? '' : 'opacity-30'}`}>
        {active ? (dir === 'asc' ? '▲' : '▼') : '◇'}
      </span>
    </button>
  );
}

/* ================ component ================ */

export default function AllInventories(props) {
  const navigate = useNavigate();
  const { t } = useI18n(props?.lang, props?.t);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState('name');      // name | updatedAt | createdAt
  const [sortDir, setSortDir] = useState('asc');       // asc | desc

  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  // load
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await inventoryService.getAll(); // публичный GET
        const list = Array.isArray(data) ? data : (data?.items ?? []);
        setRows(list.map(normalizeInventory));
      } catch (e) {
        console.error('Inventories load error:', e);
        setError(`${t('errorLoading')}${e?.message ? ': ' + e.message : ''}`);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filter/sort
  const filtered = useMemo(() => {
    const norm = (s) => (s || '').toString().toLowerCase();

    let arr = rows.filter((r) => {
      const name = norm(r.name);
      const desc = norm(r.description);
      const tags = Array.isArray(r.tags) ? r.tags.map((t) => norm(t)).join(' ') : '';
      const ownerName =
        r.ownerName ? norm(r.ownerName) :
        (typeof r.owner === 'object' && r.owner?.name ? norm(r.owner.name) : '');
      const ownerId = (typeof r.owner === 'string' ? r.owner : r.owner_id || '')
        .toString()
        .toLowerCase();
      const query = q.trim().toLowerCase();

      return (
        !query ||
        name.includes(query) ||
        desc.includes(query) ||
        tags.includes(query) ||
        ownerName.includes(query) ||
        ownerId.includes(query)
      );
    });

    const dir = sortDir === 'asc' ? 1 : -1;

    arr.sort((a, b) => {
      let va; let vb;
      if (sortKey === 'updatedAt') {
        va = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        vb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      } else if (sortKey === 'createdAt') {
        va = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        vb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else {
        va = (a?.name ?? '').toString().toLowerCase();
        vb = (b?.name ?? '').toString().toLowerCase();
      }
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    return arr;
  }, [rows, q, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  // create
  const handleCreate = async (payload) => {
    setCreating(true);
    setError('');
    try {
      const token = getToken();
      const created = await inventoryService.create(payload, token);
      setRows((prev) => [normalizeInventory(created), ...prev]);
      setShowCreate(false);
    } catch (e) {
      console.error(e);
      const message =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        t('errorLoading');
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  /* ================ UI ================ */

  // Общая сетка колонок (ширины можно подправить по вкусу)
  const GRID_COLS = '4rem 2fr 1.2fr 3fr 1.1fr';

  // skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-2xl font-semibold">{t('title')}</div>
          <div className="flex-1" />
          <div className="h-10 w-full sm:w-80 bg-gray-100 dark:bg-gray-900 rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-gray-100 dark:bg-gray-900 rounded-lg animate-pulse" />
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* header */}
          <div
            className="bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-medium"
            style={{ display: 'grid', gridTemplateColumns: GRID_COLS }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 w-24 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
            ))}
          </div>

          {/* rows */}
          {Array.from({ length: 6 }).map((_, r) => (
            <div
              key={r}
              className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 animate-pulse"
              style={{ display: 'grid', gridTemplateColumns: GRID_COLS }}
            >
              {Array.from({ length: 5 }).map((__, c) => (
                <div
                  key={c}
                  className={`h-4 ${c === 0 ? 'w-10' : 'w-32'} bg-gray-100 dark:bg-gray-900 rounded`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* errors */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 px-4 py-3">
          {error}
        </div>
      )}

      {/* toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="text-2xl font-semibold">{t('title')}</div>
        <div className="flex-1" />

        {/* search */}
        <div className="relative w-full sm:w-80">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full border rounded-xl px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:bg-transparent"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-50">⌕</span>
        </div>

        {/* create */}
        <button
          onClick={() => { setShowCreate(true); setError(''); }}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={creating}
          title={t('create')}
        >
          {creating ? t('creating') : t('create')}
        </button>
      </div>

      {/* "таблица" на div-ах */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* header */}
        <div
          role="row"
          className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur dark:bg-gray-900/95 px-4 py-3 text-sm font-semibold"
          style={{ display: 'grid', gridTemplateColumns: GRID_COLS }}
        >
          <div role="columnheader" className="text-left">{t('image')}</div>

          <div role="columnheader" className="text-left">
            <SortHeader
              active={sortKey === 'name'}
              dir={sortDir}
              onClick={() => toggleSort('name')}
              className="text-left"
            >
              {t('name')}
            </SortHeader>
          </div>

          <div role="columnheader" className="text-left">{t('owner')}</div>

          <div role="columnheader" className="text-left hidden md:block">{t('description')}</div>

          <div role="columnheader" className="text-left">
            <SortHeader
              active={sortKey === 'updatedAt'}
              dir={sortDir}
              onClick={() => toggleSort('updatedAt')}
            >
              {t('updated')}
            </SortHeader>
          </div>
        </div>

        {/* rows */}
        <div role="rowgroup">
          {filtered.map((row) => (
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
                {row.updatedAt
                  ? new Date(row.updatedAt).toLocaleDateString()
                  : (row.createdAt
                      ? new Date(row.createdAt).toLocaleDateString()
                      : '—')}
              </div>
            </div>
          ))}

          {!filtered.length && (
            <div className="px-4 py-10 text-center text-gray-500">
              {t('empty')}
            </div>
          )}
        </div>
      </div>

      {/* modal: create */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('create')}>
        <InventoryForm
          submitText={creating ? t('creating') : t('create')}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
        {/* POST требует авторизацию (JWT в Authorization) */}
      </Modal>
    </div>
  );
}
