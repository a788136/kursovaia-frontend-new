// src/components/inventory/ItemsTab.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { itemsService } from '../../services/itemsService';
import ItemForm from './ItemForm';
import LikeButton from '../LikeButton';               // ⬅️ добавлено
import { likeService } from '../../services/likeService'; // ⬅️ добавлено

function fmtDate(s) {
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  } catch { return ''; }
}

function FieldsPreview({ fields }) {
  if (!fields || typeof fields !== 'object') return <span className="opacity-50">—</span>;
  const entries = Object.entries(fields).slice(0, 3);
  if (entries.length === 0) return <span className="opacity-50">—</span>;
  return (
    <div className="text-xs text-zinc-700 dark:text-zinc-300 space-x-2">
      {entries.map(([k, v]) => (
        <span key={k}><span className="opacity-60">{k}</span>: {String(v).slice(0, 40)}</span>
      ))}
      {Object.keys(fields).length > 3 && <span className="opacity-60">…</span>}
    </div>
  );
}

export default function ItemsTab({ inventory }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState(() => new Set()); // selected ids
  const [error, setError] = useState('');

  // Лайки: id -> { count, liked, loading }
  const [likes, setLikes] = useState({});

  // Модалки создания/редактирования
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const submitting = loading === 'saving';

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  async function load() {
    if (!inventory?._id) return;
    setLoading(true);
    setError('');
    try {
      const data = await itemsService.getAll(inventory._id, { limit, offset }, token);
      setRows(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [inventory?._id, limit, offset]);

  // Подгружаем лайки для видимых строк (лениво)
  useEffect(() => {
    let dead = false;
    (async () => {
      const missing = (rows || []).filter(r => !likes[r._id]);
      if (missing.length === 0) return;

      // помечаем loading
      setLikes(prev => {
        const next = { ...prev };
        for (const r of missing) next[r._id] = { count: 0, liked: false, loading: true };
        return next;
      });

      // батч-параллель
      await Promise.all(missing.map(async (r) => {
        try {
          const data = await likeService.getLikes(r._id, token);
          if (dead) return;
          setLikes(prev => ({ ...prev, [r._id]: { count: data.count || 0, liked: !!data.liked, loading: false } }));
        } catch {
          if (dead) return;
          setLikes(prev => ({ ...prev, [r._id]: { count: 0, liked: false, loading: false } }));
        }
      }));
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function toggleAll(e) {
    if (e.target.checked) {
      setSel(new Set(rows.map(r => r._id)));
    } else {
      setSel(new Set());
    }
  }
  function toggleOne(id) {
    setSel(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  async function handleBulkDelete() {
    if (sel.size === 0) return;
    setLoading('saving');
    setError('');
    try {
      await itemsService.bulkRemove(Array.from(sel), token);
      setSel(new Set());
      // чистим кэш лайков для удалённых
      setLikes(prev => {
        const next = { ...prev };
        for (const id of sel) delete next[id];
        return next;
      });
      await load();
    } catch (e) {
      setError(e?.message || 'Bulk delete failed');
    } finally {
      setLoading(false);
    }
  }

  // Создание
  async function submitCreate(values) {
    setLoading('saving');
    setError('');
    try {
      await itemsService.create(inventory._id, { fields: values }, token);
      setShowCreate(false);
      await load();
    } catch (e) {
      setError(e?.message || 'Create failed');
    } finally {
      setLoading(false);
    }
  }

  // Редактирование
  async function submitEdit(values) {
    if (!editItem?._id) return;
    setLoading('saving');
    setError('');
    try {
      await itemsService.update(editItem._id, { fields: values }, token);
      setEditItem(null);
      await load();
    } catch (e) {
      setError(e?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  // Обновляем локальный кэш лайков по сигналу из LikeButton
  function onLikeChange(itemId, next) {
    setLikes(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || {}), ...next, loading: false } }));
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-xl bg-violet-600 text-white px-4 py-2 disabled:opacity-50"
            onClick={() => setShowCreate(true)}
            disabled={loading === 'saving'}
          >
            New item
          </button>

          <button
            type="button"
            className="rounded-xl border px-4 py-2 disabled:opacity-50"
            onClick={handleBulkDelete}
            disabled={sel.size === 0 || loading === 'saving'}
            title={sel.size === 0 ? 'Select rows to delete' : `Delete ${sel.size} selected`}
          >
            Delete selected
          </button>
        </div>

        <div className="text-sm opacity-70">
          {loading === true ? 'Loading…' : loading === 'saving' ? 'Saving…' : null}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && sel.size === rows.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="p-3 text-left">Custom ID</th>
              <th className="p-3 text-left w-24">Likes</th> {/* ⬅️ новая колонка */}
              <th className="p-3 text-left">Fields</th>
              <th className="p-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const lk = likes[r._id] || { count: 0, liked: false, loading: true };
              return (
                <tr
                  key={r._id}
                  className="border-t hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                  onClick={(e) => {
                    // Не триггерим по клику на interactive элементы
                    const tag = e.target?.tagName?.toLowerCase();
                    if (tag === 'input' || tag === 'button' || tag === 'svg' || tag === 'path') return;
                    setEditItem(r);
                  }}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={sel.has(r._id)}
                      onChange={() => toggleOne(r._id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>

                  <td className="p-3 font-mono">{r.custom_id}</td>

                  {/* Likes cell */}
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <LikeButton
                      itemId={r._id}
                      initialCount={lk.count}
                      initialLiked={lk.liked}
                      disabled={loading === 'saving' || lk.loading}
                      onChange={(next) => onLikeChange(r._id, next)} // {count, liked}
                    />
                  </td>

                  <td className="p-3"><FieldsPreview fields={r.fields} /></td>
                  <td className="p-3">{fmtDate(r.created_at)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-center opacity-60" colSpan={5}>
                  No items yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm opacity-70">
          Total: {total}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-xl border px-3 py-1 disabled:opacity-50"
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
            disabled={!canPrev || loading === true}
          >
            ← Prev
          </button>
          <select
            className="rounded-xl border px-2 py-1"
            value={limit}
            onChange={(e) => { setOffset(0); setLimit(Number(e.target.value)); }}
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button
            type="button"
            className="rounded-xl border px-3 py-1 disabled:opacity-50"
            onClick={() => setOffset((o) => o + limit)}
            disabled={!canNext || loading === true}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Modal create */}
      {showCreate && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-3">New item</div>
            <ItemForm
              schema={inventory?.fields || []}
              onSubmit={submitCreate}
              onCancel={() => setShowCreate(false)}
              submitting={submitting}
            />
          </div>
        </div>
      )}

      {/* Modal edit */}
      {editItem && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditItem(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-3">Edit item — <span className="font-mono">{editItem.custom_id}</span></div>
            <ItemForm
              schema={inventory?.fields || []}
              initial={editItem?.fields || {}}
              onSubmit={submitEdit}
              onCancel={() => setEditItem(null)}
              submitting={submitting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
