import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';

/**
 * Главная страница (публичная):
 * 1) Последние инвентаризации — списком
 * 2) Топ инвентаризаций — списком
 * 3) Теги (чипсы) + по выбранному тегу — списком
 *
 * Ничего старого не ломаем. Только чтение публичных API.
 */

const TEXT = {
  ru: {
    latest: 'Последние инвентаризации',
    top: 'Топ инвентаризаций',
    tags: 'Теги',
    byTag: (t) => `Инвентаризации с тегом: #${t}`,
    clear: 'Сбросить',
    empty: 'Ничего не найдено',
    // заголовки колонок
    image: 'Картинка',
    name: 'Название',
    owner: 'Автор',
    description: 'Описание',
    updated: 'Обновлено',
  },
  en: {
    latest: 'Latest inventories',
    top: 'Top inventories',
    tags: 'Tags',
    byTag: (t) => `Inventories tagged: #${t}`,
    clear: 'Clear',
    empty: 'Nothing found',
    // columns
    image: 'Image',
    name: 'Name',
    owner: 'Owner',
    description: 'Description',
    updated: 'Updated',
  },
};

function useI18n(langProp) {
  const lang =
    (langProp || localStorage.getItem('lang') || 'ru')
      .toLowerCase()
      .startsWith('en') ? 'en' : 'ru';
  return { lang, L: TEXT[lang] };
}

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

function formatAuthor(row) {
  if (typeof row.owner === 'object' && row.owner?.name) return row.owner.name;
  if (row.owner_id) return String(row.owner_id);
  if (typeof row.owner === 'string') return row.owner;
  return '—';
}

function formatDate(row) {
  const d = row.updatedAt || row.createdAt;
  return d ? new Date(d).toLocaleDateString() : '—';
}

/** «Таблица» на div-ах */
function ListSection({ title, items, emptyText, L, navigate }) {
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
          <div role="columnheader" className="text-left">{L.image}</div>
          <div role="columnheader" className="text-left">{L.name}</div>
          <div role="columnheader" className="text-left">{L.owner}</div>
          <div role="columnheader" className="text-left hidden md:block">{L.description}</div>
          <div role="columnheader" className="text-left">{L.updated}</div>
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

export default function HomePage({ lang: langProp }) {
  const { L } = useI18n(langProp);
  const navigate = useNavigate();

  const [latest, setLatest] = useState([]);
  const [top, setTop] = useState([]);
  const [tags, setTags] = useState([]);

  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);

  const [selectedTag, setSelectedTag] = useState('');
  const [tagItems, setTagItems] = useState([]);
  const [loadingTagItems, setLoadingTagItems] = useState(false);

  // load latest
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setLoadingLatest(true);
        const res = await inventoryService.getLatest(12);
        if (!dead) setLatest((Array.isArray(res) ? res : []).map(normalize));
      } finally {
        if (!dead) setLoadingLatest(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  // load top
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setLoadingTop(true);
        const res = await inventoryService.getTop();
        if (!dead) setTop((Array.isArray(res) ? res : []).map(normalize));
      } finally {
        if (!dead) setLoadingTop(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  // load tags
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setLoadingTags(true);
        const res = await inventoryService.getTags();
        if (!dead) setTags(Array.isArray(res) ? res : []);
      } finally {
        if (!dead) setLoadingTags(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  // inventories by selected tag
  useEffect(() => {
    let dead = false;
    (async () => {
      if (!selectedTag) { setTagItems([]); return; }
      setLoadingTagItems(true);
      try {
        const res = await inventoryService.getAll({ tag: selectedTag, limit: 24 });
        const list = Array.isArray(res) ? res : (res?.items ?? []);
        if (!dead) setTagItems(list.map(normalize));
      } finally {
        if (!dead) setLoadingTagItems(false);
      }
    })();
    return () => { dead = true; };
  }, [selectedTag]);

  return (
    <div className="space-y-10">
      {/* Latest */}
      <ListSection
        title={L.latest}
        items={latest}
        emptyText={L.empty}
        L={L}
        navigate={navigate}
      />
      {loadingLatest && <div className="text-sm text-gray-500" />}

      {/* Top */}
      <ListSection
        title={L.top}
        items={top}
        emptyText={L.empty}
        L={L}
        navigate={navigate}
      />
      {loadingTop && <div className="text-sm text-gray-500" />}

      {/* Tags */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{L.tags}</h2>

        {/* tag chips */}
        <div className="flex flex-wrap gap-2">
          {loadingTags ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-gray-100 dark:bg-gray-900 animate-pulse" />
            ))
          ) : (
            tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                className={`px-3 py-1.5 rounded-full border text-sm transition ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                }`}
                title={`#${tag}`}
              >
                #{tag}
              </button>
            ))
          )}
          {!!selectedTag && (
            <button
              onClick={() => setSelectedTag('')}
              className="px-3 py-1.5 rounded-full border text-sm border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              {L.clear}
            </button>
          )}
        </div>

        {/* inventories by selected tag — тоже в виде списка */}
        {!!selectedTag && (
          <div className="space-y-2">
            <div className="text-sm opacity-70">{L.byTag(selectedTag)}</div>

            {loadingTagItems ? (
              <div className="rounded-xl border border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-800">
                …
              </div>
            ) : (
              <ListSection
                title={''}
                items={tagItems}
                emptyText={L.empty}
                L={L}
                navigate={navigate}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
