// src/pages/AdminPanel.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/adminService';

export default function AdminPanel({ user, lang: langProp }) {
  // Язык: из пропсов -> из localStorage -> ru
  const lang =
    (langProp || localStorage.getItem('lang') || 'ru')
      .toLowerCase()
      .startsWith('en')
      ? 'en'
      : 'ru';

  const DICT = {
    ru: {
      title: 'Админка: пользователи',
      total: 'Всего',
      searchPlaceholder: 'Поиск по имени или email…',
      loading: 'Загрузка…',
      notFound: 'Ничего не найдено',
      onlyAdmins: 'Доступ только для администраторов.',
      user: 'Пользователь',
      email: 'Email',
      status: 'Статус',
      role: 'Роль',
      actions: 'Действия',
      active: 'активен',
      blocked: 'заблокирован',
      admin: 'admin',
      userRole: 'user',
      unblock: 'Разблокировать',
      block: 'Заблокировать',
      makeAdmin: 'Сделать админом',
      revokeAdmin: 'Снять админа',
      prev: '← Назад',
      next: 'Вперёд →',
      pageOf: (p, pages) => `Стр. ${p} из ${pages}`,
      cantBlockSelf: 'Нельзя блокировать себя',
      cantChangeSelfRole: 'Нельзя менять себе роль',
    },
    en: {
      title: 'Admin: users',
      total: 'Total',
      searchPlaceholder: 'Search by name or email…',
      loading: 'Loading…',
      notFound: 'Nothing found',
      onlyAdmins: 'Admins only.',
      user: 'User',
      email: 'Email',
      status: 'Status',
      role: 'Role',
      actions: 'Actions',
      active: 'active',
      blocked: 'blocked',
      admin: 'admin',
      userRole: 'user',
      unblock: 'Unblock',
      block: 'Block',
      makeAdmin: 'Make admin',
      revokeAdmin: 'Revoke admin',
      prev: '← Prev',
      next: 'Next →',
      pageOf: (p, pages) => `Page ${p} of ${pages}`,
      cantBlockSelf: 'You cannot block yourself',
      cantChangeSelfRole: 'You cannot change your own role',
    },
  };
  const L = DICT[lang];

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
        if (!dead) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, [q, page]);

  async function toggleBlock(u) {
    setSavingId(u.id);
    try {
      const next = await adminService.setBlocked(u.id, !u.blocked);
      setItems(prev => prev.map(x => (x.id === u.id ? { ...x, ...next } : x)));
    } finally {
      setSavingId(null);
    }
  }

  async function toggleAdmin(u) {
    setSavingId(u.id);
    try {
      const next = await adminService.setAdmin(u.id, !(u.isAdmin || u.role === 'admin'));
      setItems(prev => prev.map(x => (x.id === u.id ? { ...x, ...next } : x)));
    } finally {
      setSavingId(null);
    }
  }

  if (!canSee) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
        {L.onlyAdmins}
      </div>
    );
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      {/* Заголовок */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xl font-semibold">{L.title}</div>
        <div className="text-sm opacity-70">
          {L.total}: {total}
        </div>
      </div>

      {/* Поиск */}
      <div className="mb-4 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={L.searchPlaceholder}
          className="w-full rounded-md border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400
                     dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-800"
        />
      </div>

      {/* Табличный вид на div/grid */}
      {loading ? (
        <div className="opacity-70 text-sm">{L.loading}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="min-w-[880px]">
            {/* Header */}
            <div className="grid grid-cols-12 bg-gray-50 dark:bg-gray-900/60 text-sm text-gray-700 dark:text-gray-200">
              <div className="px-3 py-2 col-span-4 text-left">{L.user}</div>
              <div className="px-3 py-2 col-span-3 text-left">{L.email}</div>
              <div className="px-3 py-2 col-span-2 text-center">{L.status}</div>
              <div className="px-3 py-2 col-span-1 text-center">{L.role}</div>
              <div className="px-3 py-2 col-span-2 text-center">{L.actions}</div>
            </div>

            {/* Rows */}
            <div className="bg-white dark:bg-gray-950">
              {items.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-12 items-center border-t border-gray-200 dark:border-gray-800"
                >
                  {/* Пользователь */}
                  <div className="px-3 py-2 col-span-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          u.avatar ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                            u.email || u.id
                          )}`
                        }
                        alt="avatar"
                        className="h-8 w-8 rounded-full"
                      />
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {u.name || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="px-3 py-2 col-span-3 text-gray-700 dark:text-gray-300">
                    {u.email}
                  </div>

                  {/* Статус */}
                  <div className="px-3 py-2 col-span-2 flex justify-center">
                    {u.blocked ? (
                      <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        {L.blocked}
                      </span>
                    ) : (
                      <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        {L.active}
                      </span>
                    )}
                  </div>

                  {/* Роль */}
                  <div className="px-3 py-2 col-span-1 flex justify-center">
                    {u.isAdmin || u.role === 'admin' ? (
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {L.admin}
                      </span>
                    ) : (
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {L.userRole}
                      </span>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="px-3 py-2 col-span-2">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        className="rounded-md border px-2 py-1 hover:bg-gray-50 disabled:opacity-50
                                   dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-100"
                        onClick={() => toggleBlock(u)}
                        disabled={savingId === u.id || String(u.id) === String(user?._id)}
                        title={String(u.id) === String(user?._id) ? L.cantBlockSelf : ''}
                      >
                        {u.blocked ? L.unblock : L.block}
                      </button>
                      <button
                        className="rounded-md border px-2 py-1 hover:bg-gray-50 disabled:opacity-50
                                   dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-100"
                        onClick={() => toggleAdmin(u)}
                        disabled={savingId === u.id || String(u.id) === String(user?._id)}
                        title={String(u.id) === String(user?._id) ? L.cantChangeSelfRole : ''}
                      >
                        {u.isAdmin || u.role === 'admin' ? L.revokeAdmin : L.makeAdmin}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {!items.length && (
                <div className="border-t border-gray-200 dark:border-gray-800">
                  <div className="px-3 py-6 text-center opacity-70 text-gray-700 dark:text-gray-300">
                    {L.notFound}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Пагинация */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50
                     dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-100"
        >
          {L.prev}
        </button>
        <div className="text-sm text-gray-700 dark:text-gray-300">{L.pageOf(page, pages)}</div>
        <button
          disabled={page >= pages}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50
                     dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-100"
        >
          {L.next}
        </button>
      </div>
    </div>
  );
}
// src/pages/AdminPanel.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/adminService';

export default function AdminPanel({ user, lang: langProp }) {
  // Язык: из пропсов -> из localStorage -> ru
  const lang =
    (langProp || localStorage.getItem('lang') || 'ru')
      .toLowerCase()
      .startsWith('en')
      ? 'en'
      : 'ru';

  const DICT = {
    ru: {
      title: 'Админка: пользователи',
      total: 'Всего',
      searchPlaceholder: 'Поиск по имени или email…',
      loading: 'Загрузка…',
      notFound: 'Ничего не найдено',
      onlyAdmins: 'Доступ только для администраторов.',
      user: 'Пользователь',
      email: 'Email',
      status: 'Статус',
      role: 'Роль',
      actions: 'Действия',
      active: 'активен',
      blocked: 'заблокирован',
      admin: 'admin',
      userRole: 'user',
      unblock: 'Разблокировать',
      block: 'Заблокировать',
      makeAdmin: 'Сделать админом',
      revokeAdmin: 'Снять админа',
      prev: '← Назад',
      next: 'Вперёд →',
      pageOf: (p, pages) => `Стр. ${p} из ${pages}`,
      cantBlockSelf: 'Нельзя блокировать себя',
      cantChangeSelfRole: 'Нельзя менять себе роль',
    },
    en: {
      title: 'Admin: users',
      total: 'Total',
      searchPlaceholder: 'Search by name or email…',
      loading: 'Loading…',
      notFound: 'Nothing found',
      onlyAdmins: 'Admins only.',
      user: 'User',
      email: 'Email',
      status: 'Status',
      role: 'Role',
      actions: 'Actions',
      active: 'active',
      blocked: 'blocked',
      admin: 'admin',
      userRole: 'user',
      unblock: 'Unblock',
      block: 'Block',
      makeAdmin: 'Make admin',
      revokeAdmin: 'Revoke admin',
      prev: '← Prev',
      next: 'Next →',
      pageOf: (p, pages) => `Page ${p} of ${pages}`,
      cantBlockSelf: 'You cannot block yourself',
      cantChangeSelfRole: 'You cannot change your own role',
    },
  };
  const L = DICT[lang];

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
        if (!dead) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, [q, page]);

  async function toggleBlock(u) {
    setSavingId(u.id);
    try {
      const next = await adminService.setBlocked(u.id, !u.blocked);
      setItems(prev => prev.map(x => (x.id === u.id ? { ...x, ...next } : x)));
    } finally {
      setSavingId(null);
    }
  }

  async function toggleAdmin(u) {
    setSavingId(u.id);
    try {
      const next = await adminService.setAdmin(u.id, !(u.isAdmin || u.role === 'admin'));
      setItems(prev => prev.map(x => (x.id === u.id ? { ...x, ...next } : x)));
    } finally {
      setSavingId(null);
    }
  }

  if (!canSee) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
        {L.onlyAdmins}
      </div>
    );
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      {/* Заголовок */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xl font-semibold">{L.title}</div>
        <div className="text-sm opacity-70">
          {L.total}: {total}
        </div>
      </div>

      {/* Поиск */}
      <div className="mb-4 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={L.searchPlaceholder}
          className="w-full rounded-md border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400
                     dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-800"
        />
      </div>

      {/* Табличный вид на div/grid */}
      {loading ? (
        <div className="opacity-70 text-sm">{L.loading}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="min-w-[880px]">
            {/* Header */}
            <div className="grid grid-cols-12 bg-gray-50 dark:bg-gray-900/60 text-sm text-gray-700 dark:text-gray-200">
              <div className="px-3 py-2 col-span-4 text-left">{L.user}</div>
              <div className="px-3 py-2 col-span-3 text-left">{L.email}</div>
              <div className="px-3 py-2 col-span-2 text-center">{L.status}</div>
              <div className="px-3 py-2 col-span-1 text-center">{L.role}</div>
              <div className="px-3 py-2 col-span-2 text-center">{L.actions}</div>
            </div>

            {/* Rows */}
            <div className="bg-white dark:bg-gray-950">
              {items.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-12 items-center border-t border-gray-200 dark:border-gray-800"
                >
                  {/* Пользователь */}
                  <div className="px-3 py-2 col-span-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          u.avatar ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                            u.email || u.id
                          )}`
                        }
                        alt="avatar"
                        className="h-8 w-8 rounded-full"
                      />
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {u.name || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="px-3 py-2 col-span-3 text-gray-700 dark:text-gray-300">
                    {u.email}
                  </div>

                  {/* Статус */}
                  <div className="px-3 py-2 col-span-2 flex justify-center">
                    {u.blocked ? (
                      <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        {L.blocked}
                      </span>
                    ) : (
                      <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        {L.active}
                      </span>
                    )}
                  </div>

                  {/* Роль */}
                  <div className="px-3 py-2 col-span-1 flex justify-center">
                    {u.isAdmin || u.role === 'admin' ? (
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {L.admin}
                      </span>
                    ) : (
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {L.userRole}
                      </span>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="px-3 py-2 col-span-2">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        className="rounded-md border px-2 py-1 hover:bg-gray-50 disabled:opacity-50
                                   dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-100"
                        onClick={() => toggleBlock(u)}
                        disabled={savingId === u.id || String(u.id) === String(user?._id)}
                        title={String(u.id) === String(user?._id) ? L.cantBlockSelf : ''}
                      >
                        {u.blocked ? L.unblock : L.block}
                      </button>
                      <button
                        className="rounded-md border px-2 py-1 hover:bg-gray-50 disabled:opacity-50
                                   dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-100"
                        onClick={() => toggleAdmin(u)}
                        disabled={savingId === u.id || String(u.id) === String(user?._id)}
                        title={String(u.id) === String(user?._id) ? L.cantChangeSelfRole : ''}
                      >
                        {u.isAdmin || u.role === 'admin' ? L.revokeAdmin : L.makeAdmin}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {!items.length && (
                <div className="border-t border-gray-200 dark:border-gray-800">
                  <div className="px-3 py-6 text-center opacity-70 text-gray-700 dark:text-gray-300">
                    {L.notFound}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Пагинация */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50
                     dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-100"
        >
          {L.prev}
        </button>
        <div className="text-sm text-gray-700 dark:text-gray-300">{L.pageOf(page, pages)}</div>
        <button
          disabled={page >= pages}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50
                     dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-100"
        >
          {L.next}
        </button>
      </div>
    </div>
  );
}
