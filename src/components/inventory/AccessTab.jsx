// src/components/inventory/AccessTab.jsx
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { accessService } from '../../services/accessService';
import { usersService } from '../../services/usersService';

export default function AccessTab({ inventory, user }) {
  const invId = inventory?._id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [owner, setOwner] = useState(null);
  const [items, setItems] = useState([]); // [{ user:{id,name,email,avatar,blocked}, accessType }]
  const [query, setQuery] = useState('');
  const [suggests, setSuggests] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newAccess, setNewAccess] = useState('read');
  const [saving, setSaving] = useState(false);

  // ===== Новое: управление глобальной ролью (только для админов) =====
  const canAssignRoles = useMemo(
    () => !!(user && (user.isAdmin || user.role === 'admin')),
    [user]
  );
  const [roleQuery, setRoleQuery] = useState('');
  const [roleSuggests, setRoleSuggests] = useState([]);
  const [roleTarget, setRoleTarget] = useState(null); // {id, name, email, avatar, role?}
  const [roleValue, setRoleValue] = useState('user');
  const [roleSaving, setRoleSaving] = useState(false);
  // для строк в таблице (быстрый просмотр текущей роли без перезагрузки)
  const [roleMap, setRoleMap] = useState({}); // { [userId]: 'user' | 'admin' }

  const canManage = useMemo(() => {
    if (!user || !inventory) return false;
    const isAdmin = user?.isAdmin || user?.role === 'admin';
    const isOwner = String(inventory.owner_id || inventory.owner) === String(user._id);
    return isAdmin || isOwner;
  }, [user, inventory]);

  // Загрузка текущих доступов
  useEffect(() => {
    let dead = false;
    (async () => {
      if (!invId) return;
      setLoading(true);
      setError('');
      try {
        const data = await accessService.list(invId);
        if (dead) return;
        setOwner(data.owner || null);
        const arr = Array.isArray(data.items) ? data.items : [];
        setItems(arr);

        // подгрузим роли для отображения, но только если админ (остальным роли не нужны)
        if (canAssignRoles && arr.length) {
          const ids = Array.from(new Set(arr.map((x) => String(x.user?.id)).filter(Boolean)));
          try {
            const results = await Promise.all(
              ids.map((id) => usersService.getById(id).catch(() => null))
            );
            const map = {};
            results.forEach((u) => {
              if (u && (u._id || u.id)) {
                const uid = String(u._id || u.id);
                const role = (u.role === 'admin' || u.isAdmin) ? 'admin' : (u.role || 'user');
                map[uid] = role;
              }
            });
            if (!dead) setRoleMap(map);
          } catch {}
        }
      } catch (e) {
        if (!dead) setError(e?.message || 'Не удалось загрузить доступы');
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invId, canAssignRoles]);

  // Автокомплит для добавления доступа
  useEffect(() => {
    let dead = false;
    const id = setTimeout(async () => {
      if (!query.trim()) { setSuggests([]); return; }
      try {
        const list = await usersService.search(query.trim(), 8);
        if (!dead) setSuggests(list);
      } catch {
        if (!dead) setSuggests([]);
      }
    }, 250);
    return () => { dead = true; clearTimeout(id); };
  }, [query]);

  // Автокомплит для назначения роли (только админ)
  useEffect(() => {
    if (!canAssignRoles) return;
    let dead = false;
    const id = setTimeout(async () => {
      if (!roleQuery.trim()) { setRoleSuggests([]); return; }
      try {
        const list = await usersService.search(roleQuery.trim(), 8);
        if (!dead) setRoleSuggests(list);
      } catch {
        if (!dead) setRoleSuggests([]);
      }
    }, 250);
    return () => { dead = true; clearTimeout(id); };
  }, [roleQuery, canAssignRoles]);

  function sortedItems(arr) {
    return [...arr].sort((a, b) => {
      const an = a.user?.name || a.user?.email || '';
      const bn = b.user?.name || b.user?.email || '';
      if (a.accessType !== b.accessType) return a.accessType === 'write' ? -1 : 1;
      return an.localeCompare(bn, 'ru');
    });
  }

  async function applyChanges(payload) {
    setSaving(true);
    setError('');
    try {
      const data = await accessService.update(invId, payload);
      setOwner(data.owner || null);
      setItems(Array.isArray(data.items) ? data.items : []);
      setQuery('');
      setSuggests([]);
      setSelectedUser(null);
      setNewAccess('read');
    } catch (e) {
      setError(e?.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  const onAdd = async () => {
    if (!selectedUser) return;
    const changes = [{ userId: selectedUser.id, accessType: newAccess }];
    await applyChanges({ changes, remove: [] });
  };

  const onRemove = async (userId) => {
    await applyChanges({ changes: [], remove: [userId] });
  };

  const onChangeLevel = async (userId, next) => {
    await applyChanges({ changes: [{ userId, accessType: next }], remove: [] });
  };

  // ===== Новое: сохранить роль пользователю (admin-only) =====
  async function saveUserRole() {
    if (!roleTarget) return;
    try {
      setRoleSaving(true);
      const saved = await usersService.setRole(roleTarget.id, roleValue);
      // Обновим локальную карту ролей (и таргет)
      const uid = String(roleTarget.id);
      setRoleMap((m) => ({ ...m, [uid]: (saved.user?.role === 'admin' || saved.user?.isAdmin) ? 'admin' : (saved.user?.role || roleValue) }));
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Не удалось назначить роль');
    } finally {
      setRoleSaving(false);
    }
  }

  // при выборе пользователя в блоке назначения роли — подтянем текущую роль
  async function pickRoleTarget(u) {
    setRoleTarget(u);
    setRoleQuery(u.name || u.email || '');
    setRoleSuggests([]);
    try {
      const full = await usersService.getById(u.id);
      const current = (full.role === 'admin' || full.isAdmin) ? 'admin' : (full.role || 'user');
      setRoleValue(current);
    } catch {
      setRoleValue('user');
    }
  }

  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-4">
        <div className="text-lg font-semibold">Доступы</div>
        <div className="text-sm opacity-70">Назначайте права на чтение/запись для пользователей.</div>
      </div>

      {loading ? (
        <div className="opacity-70 text-sm">Загрузка…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
      ) : (
        <>
          <div className="mb-4">
            <div className="mb-2 text-sm opacity-70">Владелец</div>
            <div className="flex items-center gap-3 rounded-xl border p-3">
              <img
                src={owner?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(owner?.email || owner?.id || '')}`}
                alt="avatar" className="h-8 w-8 rounded-full"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{owner?.name || owner?.email || '—'}</div>
                <div className="text-xs opacity-60">{owner?.email}</div>
              </div>
              <span className="rounded-md bg-gray-100 px-2 py-1 text-xs">owner</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-2 text-sm opacity-70">Пользователи с доступом</div>
            {sortedItems(items).map((row) => {
              const uid = String(row.user.id);
              const role = roleMap[uid]; // 'user' | 'admin' | undefined
              return (
                <div key={uid} className="mb-2 flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex items-center gap-3 sm:flex-1">
                    <img
                      src={row.user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(row.user.email || uid)}`}
                      alt="avatar" className="h-8 w-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {row.user.name || row.user.email}
                        {row.user.blocked ? <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-[11px] text-yellow-800">заблокирован</span> : null}
                      </div>
                      <div className="text-xs opacity-60">{row.user.email}</div>
                    </div>
                  </div>

                  {/* управление уровнем доступа к этой инвентаризации */}
                  <div className="flex items-center gap-2">
                    {canManage ? (
                      <>
                        <select
                          value={row.accessType}
                          onChange={(e) => onChangeLevel(uid, e.target.value)}
                          className="rounded-md border px-2 py-1 text-sm"
                          disabled={saving}
                        >
                          <option value="read">read</option>
                          <option value="write">write</option>
                        </select>
                        <button
                          className="rounded-md border px-2 py-1 text-sm hover:bg-red-50"
                          onClick={() => onRemove(uid)}
                          disabled={saving}
                        >
                          Удалить
                        </button>
                      </>
                    ) : (
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs">{row.accessType}</span>
                    )}

                    {/* Новое: глобальная роль — только для админов */}
                    {canAssignRoles && (
                      <div className="ml-2 flex items-center gap-1">
                        <span className="text-xs opacity-60">роль:</span>
                        <select
                          value={role || 'user'}
                          onChange={async (e) => {
                            const next = e.target.value;
                            try {
                              setRoleMap((m) => ({ ...m, [uid]: next })); // оптимистично
                              const saved = await usersService.setRole(uid, next);
                              const savedRole = (saved.user?.role === 'admin' || saved.user?.isAdmin) ? 'admin' : (saved.user?.role || next);
                              setRoleMap((m) => ({ ...m, [uid]: savedRole }));
                            } catch (err) {
                              // откат если ошибка
                              setRoleMap((m) => ({ ...m, [uid]: role || 'user' }));
                            }
                          }}
                          className="rounded-md border px-2 py-1 text-xs"
                          disabled={roleSaving}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {!items.length && <div className="rounded-md border p-3 text-sm opacity-70">Пока никому доступ не выдан.</div>}
          </div>

          {canManage && (
            <div className="rounded-2xl border p-4">
              <div className="mb-2 text-sm opacity-70">Добавить пользователя</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelectedUser(null); }}
                    placeholder="Email или имя"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                  {query && suggests.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-white p-1 shadow">
                      {suggests.map(u => (
                        <div
                          key={u.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100 ${selectedUser?.id === u.id ? 'bg-gray-50' : ''}`}
                          onClick={() => { setSelectedUser(u); setQuery(`${u.name || u.email}`); }}
                        >
                          <img src={u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(u.email || u.id)}`} alt="a" className="h-6 w-6 rounded-full" />
                          <div className="flex-1">
                            <div className="text-sm">{u.name || u.email}</div>
                            <div className="text-xs opacity-60">{u.email}</div>
                          </div>
                          {u.blocked && <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[11px] text-yellow-800">заблокирован</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <select
                  value={newAccess}
                  onChange={(e) => setNewAccess(e.target.value)}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  <option value="read">read</option>
                  <option value="write">write</option>
                </select>

                <button
                  className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                  onClick={onAdd}
                  disabled={!selectedUser || saving}
                >
                  Добавить
                </button>
              </div>
            </div>
          )}

          {/* Новый административный блок: назначение роли любому пользователю */}
          {canAssignRoles && (
            <div className="mt-6 rounded-2xl border p-4">
              <div className="mb-2 text-sm opacity-70">Назначение глобальной роли (админ)</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <input
                    value={roleQuery}
                    onChange={(e) => { setRoleQuery(e.target.value); setRoleTarget(null); }}
                    placeholder="Найти пользователя по email или имени"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                  {roleQuery && roleSuggests.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-white p-1 shadow">
                      {roleSuggests.map(u => (
                        <div
                          key={u.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100 ${roleTarget?.id === u.id ? 'bg-gray-50' : ''}`}
                          onClick={() => pickRoleTarget(u)}
                        >
                          <img src={u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(u.email || u.id)}`} alt="a" className="h-6 w-6 rounded-full" />
                          <div className="flex-1">
                            <div className="text-sm">{u.name || u.email}</div>
                            <div className="text-xs opacity-60">{u.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <select
                  value={roleValue}
                  onChange={(e) => setRoleValue(e.target.value)}
                  className="rounded-md border px-3 py-2 text-sm"
                  disabled={!roleTarget || roleSaving}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>

                <button
                  className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                  onClick={saveUserRole}
                  disabled={!roleTarget || roleSaving}
                >
                  Сохранить роль
                </button>
              </div>
              {roleTarget && (
                <div className="mt-2 text-xs opacity-70">
                  Назначается роль пользователю: <b>{roleTarget.name || roleTarget.email}</b>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

AccessTab.propTypes = {
  inventory: PropTypes.object.isRequired,
  user: PropTypes.object,
};
