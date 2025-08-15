// src/pages/AdminPanel.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/adminService';

export default function AdminPanel({ user }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState(null);
  const limit = 20;

  const canSee = useMemo(() => !!(user && (user.isAdmin || user.role === 'admin')), [user]);

  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true);
      try {
        const res = await adminService.listUsers({ q, page, limit });
        if (dead) return;
        setItems(res.items || []);
        setTotal(res.total || 0);
      } catch {
        if (!dead) { setItems([]); setTotal(0); }
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [q, page]);

  async function toggleBlock(u) {
    setSavingId(u.id);
    try {
      const next = await adminService.setBlocked(u.id, !u.blocked);
      setItems(prev => prev.map(x => x.id === u.id ? { ...x, ...next } : x));
    } finally {
      setSavingId(null);
    }
  }
  async function toggleAdmin(u) {
    setSavingId(u.id);
    try {
      const next = await adminService.setAdmin(u.id, !(u.isAdmin || u.role === 'admin'));
      setItems(prev => prev.map(x => x.id === u.id ? { ...x, ...next } : x));
    } finally {
      setSavingId(null);
    }
  }

  if (!canSee) {
    return <div className="rounded-xl border p-4 text-sm text-red-600">Доступ только для администраторов.</div>;
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xl font-semibold">Админка: пользователи</div>
        <div className="text-sm opacity-70">Всего: {total}</div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Поиск по имени или email…"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="opacity-70 text-sm">Загрузка…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Пользователь</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2">Статус</th>
                <th className="px-3 py-2">Роль</th>
                <th className="px-3 py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(u.email || u.id)}`} alt="a" className="h-8 w-8 rounded-full" />
                      <div className="font-medium">{u.name || '—'}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    {u.blocked ? <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">заблокирован</span> : <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">активен</span>}
                  </td>
                  <td className="px-3 py-2">
                    {(u.isAdmin || u.role === 'admin') ? <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">admin</span> : <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">user</span>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className="rounded-md border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => toggleBlock(u)}
                        disabled={savingId === u.id || String(u.id) === String(user?._id)}
                        title={String(u.id) === String(user?._id) ? 'Нельзя блокировать себя' : ''}
                      >
                        {u.blocked ? 'Разблокировать' : 'Заблокировать'}
                      </button>
                      <button
                        className="rounded-md border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => toggleAdmin(u)}
                        disabled={savingId === u.id || String(u.id) === String(user?._id)}
                        title={String(u.id) === String(user?._id) ? 'Нельзя менять себе роль' : ''}
                      >
                        {(u.isAdmin || u.role === 'admin') ? 'Снять админа' : 'Сделать админом'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td className="px-3 py-6 text-center opacity-60" colSpan={5}>Ничего не найдено</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
        >
          ← Назад
        </button>
        <div className="text-sm">Стр. {page} из {pages}</div>
        <button
          disabled={page >= pages}
          onClick={() => setPage(p => Math.min(pages, p + 1))}
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
        >
          Вперёд →
        </button>
      </div>
    </div>
  );
}
