// src/pages/SearchResults.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchService } from '../services/searchService';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let dead = false;
    (async () => {
      if (!q.trim()) { setRes(null); return; }
      setLoading(true);
      setError('');
      try {
        const data = await searchService.search({ q, type, page: 1, limit: 20 });
        if (!dead) setRes(data);
      } catch (e) {
        if (!dead) setError(e?.message || 'Ошибка поиска');
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [q, type]);

  function setType(t) {
    const next = new URLSearchParams(searchParams);
    next.set('type', t);
    setSearchParams(next, { replace: true });
  }

  return (
    <div>
      <div className="mb-4 text-xl font-semibold">Поиск</div>

      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); }}>
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Введите запрос…"
          value={q}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams);
            next.set('q', e.target.value);
            setSearchParams(next, { replace: true });
          }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="all">Все</option>
          <option value="inventories">Инвентари</option>
          <option value="items">Айтемы</option>
        </select>
      </form>

      {loading && <div className="text-sm opacity-70">Идёт поиск…</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      {!loading && res && (type === 'all' || type === 'inventories') && (
        <div className="mb-6">
          <div className="mb-2 text-sm font-semibold">Инвентари ({res?.inventories?.total || 0})</div>
          <div className="grid gap-3">
            {(res?.inventories?.items || []).map((i) => (
              <Link key={i._id} to={`/inventories/${i._id}`} className="block rounded-xl border p-3 hover:bg-gray-50">
                <div className="font-medium">{i.name || 'Без названия'}</div>
                <div className="text-sm opacity-70">{i.description}</div>
                {Array.isArray(i.tags) && i.tags.length ? (
                  <div className="mt-1 text-xs opacity-60">{i.tags.join(', ')}</div>
                ) : null}
              </Link>
            ))}
            {!((res?.inventories?.items || []).length) && <div className="rounded-md border p-3 text-sm opacity-70">Ничего не найдено</div>}
          </div>
        </div>
      )}

      {!loading && res && (type === 'all' || type === 'items') && (
        <div className="mb-6">
          <div className="mb-2 text-sm font-semibold">Айтемы ({res?.items?.total || 0})</div>
          <div className="grid gap-3">
            {(res?.items?.items || []).map((it) => (
              <Link key={it._id} to={`/items/${it._id}`} className="block rounded-xl border p-3 hover:bg-gray-50">
                <div className="font-medium">{it.name || 'Без названия'}</div>
                <div className="text-sm opacity-70">{it.description}</div>
                {Array.isArray(it.tags) && it.tags.length ? (
                  <div className="mt-1 text-xs opacity-60">{it.tags.join(', ')}</div>
                ) : null}
              </Link>
            ))}
            {!((res?.items?.items || []).length) && <div className="rounded-md border p-3 text-sm opacity-70">Ничего не найдено</div>}
          </div>
        </div>
      )}
    </div>
  );
}
