// src/pages/SearchPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchAll } from '../services/searchService';
import InventoryGrid from '../components/inventories/InventoryGrid';
import { normalizeInventory } from '../components/inventories/listHelpers';

const TEXT = {
  ru: {
    title: 'Результаты поиска',
    nothing: 'Ничего не найдено',
    inventories: 'Инвентаризации',
    items: 'Элементы',
    total: (n) => `Всего: ${n}`,
    searchPh: 'Поиск…',
    open: 'Открыть',
    inInventory: 'в инвентаризации',
  },
  en: {
    title: 'Search results',
    nothing: 'Nothing found',
    inventories: 'Inventories',
    items: 'Items',
    total: (n) => `Total: ${n}`,
    searchPh: 'Search…',
    open: 'Open',
    inInventory: 'in inventory',
  },
};

export default function SearchPage({ lang = 'ru' }) {
  const L = (TEXT[lang] || TEXT.ru);
  const [sp] = useSearchParams();
  const q = (sp.get('q') || '').trim();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [data, setData]       = useState({ inventories: null, items: null });

  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!q) { setData({ inventories: null, items: null }); return; }
      setLoading(true); setError('');
      try {
        const resp = await searchAll({ q, type: 'all', page: 1, limit: 20 });
        if (ignore) return;
        setData(resp);
      } catch (e) {
        if (ignore) return;
        setError(e?.message || 'Search failed');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => { ignore = true; };
  }, [q]);

  const rows = useMemo(() => {
    const list = data?.inventories?.items || [];
    return list.map(normalizeInventory);
  }, [data]);

  const items = data?.items?.items || [];

  const onSubmitLocal = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const term = String(form.get('q') || '').trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{L.title}</h1>
        <form onSubmit={onSubmitLocal} className="w-80 max-w-full">
          <input
            name="q"
            defaultValue={q}
            placeholder={L.searchPh}
            className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
          />
        </form>
      </div>

      {loading && (
        <div className="opacity-70">Идёт поиск…</div>
      )}
      {!!error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 p-3">{error}</div>
      )}

      {!loading && !error && !rows.length && !(items && items.length) && (
        <div className="opacity-60">{L.nothing}</div>
      )}

      {/* Inventories */}
      {!!rows.length && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">{L.inventories}</div>
            <div className="text-sm opacity-70">{L.total(data?.inventories?.total || rows.length)}</div>
          </div>
          <InventoryGrid
            rows={rows}
            onRowClick={(row) => navigate(`/inventories/${row._id}`)}
            sortKey="relevance"
            sortDir="desc"
            toggleSort={() => {}}
            t={(key) => ({
              name: 'Название',
              owner: 'Автор',
              description: 'Описание',
              updated: 'Обновлено',
            }[key] || key)}
          />
        </section>
      )}

      {/* Items */}
      {!!(items && items.length) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">{L.items}</div>
            <div className="text-sm opacity-70">{L.total(data?.items?.total || items.length)}</div>
          </div>
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it._id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                <div className="font-medium">{it.name || it.title || 'Без названия'}</div>
                <div className="text-sm opacity-70">
                  {L.inInventory} <button
                    className="underline hover:no-underline"
                    onClick={() => navigate(`/inventories/${it.inventory_id}?tab=items`)}
                  >
                    {it.inventoryName || it.inventory_id}
                  </button>
                </div>
                {it.preview && (
                  <div className="text-sm mt-1">{String(it.preview).slice(0, 140)}</div>
                )}
                <div className="text-xs opacity-60 mt-1">{it.updatedAt ? new Date(it.updatedAt).toLocaleString() : ''}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
