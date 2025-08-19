import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';

/**
 * Главная страница (публичная):
 * 1) Последние инвентаризации
 * 2) Топ инвентаризаций
 * 3) Теги (клик — показать блок "По тегу …")
 *
 * ВАЖНО: ничего не ломаем — это отдельная страница, только чтение публичных API.
 */

const TEXT = {
  ru: {
    latest: 'Последние инвентаризации',
    top: 'Топ инвентаризаций',
    tags: 'Теги',
    byTag: (t) => `Инвентаризации с тегом: #${t}`,
    clear: 'Сбросить',
    empty: 'Ничего не найдено',
    more: 'Открыть',
  },
  en: {
    latest: 'Latest inventories',
    top: 'Top inventories',
    tags: 'Tags',
    byTag: (t) => `Inventories tagged: #${t}`,
    clear: 'Clear',
    empty: 'Nothing found',
    more: 'Open',
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

function Card({ item }) {
  return (
    <Link
      to={`/inventories/${item._id}`}
      className="group rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition dark:border-gray-800"
      title={item.name}
    >
      <div className="aspect-video bg-gray-100 dark:bg-gray-900">
        {item.cover ? (
          <img
            src={item.cover}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="p-3">
        <div className="font-medium line-clamp-1">{item.name}</div>
        {item.description ? (
          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
            {item.description}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function Section({ title, items, emptyText }) {
  if (!items?.length) {
    return (
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="rounded-xl border border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-800">
          {emptyText}
        </div>
      </section>
    );
  }
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((it) => <Card key={it._id} item={it} />)}
      </div>
    </section>
  );
}

export default function HomePage({ lang: langProp }) {
  const { lang, L } = useI18n(langProp);

  const [latest, setLatest] = useState([]);
  const [top, setTop] = useState([]);
  const [tags, setTags] = useState([]);

  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);

  const [selectedTag, setSelectedTag] = useState('');
  const [tagItems, setTagItems] = useState([]);
  const [loadingTagItems, setLoadingTagItems] = useState(false);

  // load latest/top/tags
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

  // when tag selected — fetch inventories by tag
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
      <Section
        title={L.latest}
        items={latest}
        emptyText={L.empty}
      />
      {loadingLatest && (
        <div className="text-sm text-gray-500">{/* skeleton можно добавить позже */}</div>
      )}

      {/* Top */}
      <Section
        title={L.top}
        items={top}
        emptyText={L.empty}
      />
      {loadingTop && (
        <div className="text-sm text-gray-500"></div>
      )}

      {/* Tags */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{L.tags}</h2>

        {/* tag chips */}
        <div className="flex flex-wrap gap-2">
          {loadingTags ? (
            <>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-8 w-20 rounded-full bg-gray-100 dark:bg-gray-900 animate-pulse" />
              ))}
            </>
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

        {/* inventories by selected tag */}
        {!!selectedTag && (
          <>
            <div className="text-sm opacity-70">{L.byTag(selectedTag)}</div>
            {loadingTagItems ? (
              <div className="rounded-xl border border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-800">
                …
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tagItems.length
                  ? tagItems.map((it) => <Card key={it._id} item={it} />)
                  : <div className="text-sm text-gray-500">{L.empty}</div>
                }
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
