// src/pages/AllInventories.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';
import InventoryForm from '../components/InventoryForm';
import Modal from '../components/Modal';

// ===== i18n =====
const MESSAGES = {
  ru: {
    title: 'Инвентаризации',
    searchPlaceholder: 'Поиск (название, автор, тег)…',
    create: 'Создать',
    creating: 'Создаём…',
    loading: 'Загрузка…',
    errorLoading: 'Не удалось загрузить инвентаризации',
    empty: 'Ничего не найдено',
    sortBy: 'Сортировать',
    sort_name: 'По названию',
    sort_updated: 'По обновлению',
    sort_created: 'По созданию',
    author: 'Автор',
    description: 'Описание',
  },
  en: {
    title: 'Inventories',
    searchPlaceholder: 'Search (name, owner, tag)…',
    create: 'Create',
    creating: 'Creating…',
    loading: 'Loading…',
    errorLoading: 'Failed to load inventories',
    empty: 'Nothing found',
    sortBy: 'Sort by',
    sort_name: 'Name',
    sort_updated: 'Updated',
    sort_created: 'Created',
    author: 'Owner',
    description: 'Description',
  },
};

// Поддержка схемы из App: можно передать { lang, t }, а можно не передавать
function useI18n(langProp, tProp) {
  const lang = (langProp || localStorage.getItem('lang') || 'ru').toLowerCase().startsWith('en')
    ? 'en'
    : 'ru';

  const fallbackT = (key) => MESSAGES[lang]?.[key] ?? key;
  const t = (key) => {
    const fromApp = tProp?.[lang]?.[key];
    return fromApp ?? fallbackT(key);
  };

  return { lang, t };
}

// ===== helpers =====

// Достаём JWT (если используешь контекст — можно заменить)
function getToken() {
  try {
    return localStorage.getItem('token') || '';
  } catch {
    return '';
  }
}

// Универсальный маппер элемента инвентаризации
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

// Форматирование автора
function formatAuthor(row) {
  if (typeof row.owner === 'object' && row.owner?.name) return row.owner.name;
  if (row.owner_id) return String(row.owner_id);
  if (typeof row.owner === 'string') return row.owner;
  return '—';
}

// Маленький скелетон-карточка
function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-900 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
        <div className="h-3 w-full bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function AllInventories(props) {
  const navigate = useNavigate();
  const { t } = useI18n(props?.lang, props?.t);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState('name'); // name | updatedAt | createdAt
  const [sortDir, setSortDir] = useState('asc');  // asc | desc

  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  // Загрузка списка
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await inventoryService.getAll(); // публичный GET — без cookies
        const list = Array.isArray(data) ? data : (data?.items ?? []);
        setRows(list.map(normalizeInventory));
      } catch (e) {
        console.error('Inventories load error:', e);
        setError(`${t('errorLoading')}${e?.message ? `: ${e.message}` : ''}`);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Фильтрация/сортировка
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
      let va;
      let vb;

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

  const toggleSortDir = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));

  // Создание — POST (нужен JWT)
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

  // ===== UI =====

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="text-2xl font-semibold">{t('title')}</div>
          <div className="flex-1" />
          <div className="h-10 w-full md:w-80 bg-gray-100 dark:bg-gray-900 rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-gray-100 dark:bg-gray-900 rounded-lg animate-pulse" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 px-4 py-3">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="text-2xl font-semibold">{t('title')}</div>
        <div className="flex-1" />

        {/* Поиск */}
        <div className="relative w-full sm:w-80">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full border rounded-xl px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:bg-transparent"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-50">⌕</span>
        </div>

        {/* Сортировка */}
        <div className="flex items-center gap-2">
          <label className="text-sm opacity-70">{t('sortBy')}</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm dark:bg-transparent"
            title={t('sortBy')}
          >
            <option value="name">{t('sort_name')}</option>
            <option value="updatedAt">{t('sort_updated')}</option>
            <option value="createdAt">{t('sort_created')}</option>
          </select>
          <button
            type="button"
            onClick={toggleSortDir}
            className="px-3 py-2 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-900 text-sm"
            title={sortDir === 'asc' ? 'Asc' : 'Desc'}
          >
            {sortDir === 'asc' ? '▲' : '▼'}
          </button>
        </div>

        {/* Создать */}
        <button
          onClick={() => { setShowCreate(true); setError(''); }}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={creating}
          title={t('create')}
        >
          {creating ? t('creating') : t('create')}
        </button>
      </div>

      {/* Сетка карточек */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <div
              key={row._id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/inventories/${row._id}`)}
              onKeyDown={(e) => (e.key === 'Enter' ? navigate(`/inventories/${row._id}`) : null)}
              className="group rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition cursor-pointer bg-white/70 dark:bg-black/20 backdrop-blur"
              title={row.name || 'Inventory'}
            >
              {/* Cover */}
              <div className="relative">
                {row.cover ? (
                  <img
                    src={row.cover}
                    alt=""
                    className="aspect-[16/9] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="aspect-[16/9] w-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center text-gray-400 text-sm">
                    —
                  </div>
                )}
                {/* маленький индикатор обновления в правом верхнем углу */}
                {row.updatedAt && (
                  <div className="absolute right-2 top-2 text-[10px] px-2 py-1 rounded-full bg-white/80 dark:bg-black/40 border">
                    {new Date(row.updatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4 space-y-2">
                <div className="font-medium leading-snug group-hover:underline">
                  {row.name || '—'}
                </div>

                <div className="text-xs opacity-70">
                  {t('author')}: {formatAuthor(row)}
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {row.description || '—'}
                </div>

                {/* Теги */}
                {Array.isArray(row.tags) && row.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {row.tags.slice(0, 5).map((tg, i) => (
                      <span
                        key={`${tg}-${i}`}
                        className="text-[10px] px-2 py-1 rounded-full border bg-gray-50 dark:bg-gray-900"
                      >
                        {tg}
                      </span>
                    ))}
                    {row.tags.length > 5 && (
                      <span className="text-[10px] px-2 py-1 rounded-full border bg-gray-50 dark:bg-gray-900">
                        +{row.tags.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Пустое состояние
        <div className="rounded-2xl border border-dashed p-10 text-center text-gray-500">
          {t('empty')}
        </div>
      )}

      {/* Модалка: создание */}
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
