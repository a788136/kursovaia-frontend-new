// src/pages/AllInventories.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { inventoryService } from '../services/inventoryService';
import InventoryForm from '../components/InventoryForm';

// В проектных требованиях нельзя ставить кнопки в строках таблицы.
// Поэтому редактирование открываем по клику на строку, а "Создать" — в тулбаре.
export default function AllInventories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // загрузка списка
  useEffect(() => {
    (async () => {
      try {
        const data = await inventoryService.getAll();
        // Поддержка обеих реализаций сервиса:
        // - если вернули { items, ... }
        // - если вернули просто массив
        setRows(Array.isArray(data) ? data : (data?.items ?? []));
      } catch (e) {
        console.error(e);
        setError('Не удалось загрузить инвентаризации');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const norm = (s) => (s || '').toString().toLowerCase();
    let arr = rows.filter(r => {
      const name = norm(r.name);
      const desc = norm(r.description);
      const tags = Array.isArray(r.tags) ? r.tags.map(t => norm(t)).join(' ') : '';
      const ownerName = typeof r.owner === 'object' && r.owner?.name ? norm(r.owner.name) : '';
      const ownerId = (typeof r.owner === 'string' ? r.owner : '').toLowerCase();
      const query = q.trim().toLowerCase();
      return !query || name.includes(query) || desc.includes(query) || tags.includes(query) || ownerName.includes(query) || ownerId.includes(query);
    });

    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const va = (a?.[sortKey] ?? '').toString().toLowerCase();
      const vb = (b?.[sortKey] ?? '').toString().toLowerCase();
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    return arr;
  }, [rows, q, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  // СОЗДАНИЕ — реальный POST
  const handleCreate = async (payload) => {
    setCreating(true);
    setError('');
    try {
      const created = await inventoryService.create(payload); // ← Требуется валидный JWT (авторизация)
      // Оптимистично добавляем в начало списка
      setRows(prev => [created, ...prev]);
      setShowCreate(false);
    } catch (e) {
      console.error(e);
      // Заметка: 401 — нет/просрочен токен; 403 — нет прав; 400 — серверная валидация
      setError(e?.response?.data?.error || 'Не удалось создать инвентаризацию');
    } finally {
      setCreating(false);
    }
  };

  // ОБНОВЛЕНИЕ — реальный PUT
  const handleUpdate = async (payload) => {
    if (!editItem?._id) return;
    setUpdating(true);
    setError('');
    try {
      const updated = await inventoryService.update(editItem._id, payload); // ← Требуется валидный JWT + права
      setRows(prev => prev.map(r => (String(r._id) === String(updated._id) ? updated : r)));
      setEditItem(null);
    } catch (e) {
      console.error(e);
      // Заметка: 401 — нет/просрочен токен; 403 — не владелец/не админ; 400 — серверная валидация
      setError(e?.response?.data?.error || 'Не удалось обновить инвентаризацию');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="text-gray-500">Загрузка...</div>;
  return (
    <div className="space-y-6">
      {/* Ошибка верхнего уровня */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 px-4 py-2">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="text-2xl font-semibold">Инвентаризации</div>
        <div className="flex-1" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Поиск (название, автор, тег)..."
          className="w-full md:w-80 border rounded-lg px-3 py-2"
        />
        <button
          onClick={() => { setShowCreate(true); setError(''); }}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={creating || updating}
          title="Создать новую инвентаризацию"
        >
          Создать
        </button>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left w-16">Картинка</th>
              <th className="px-4 py-3 text-left cursor-pointer" onClick={() => toggleSort('name')}>
                Название {sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-4 py-3 text-left">Автор</th>
              <th className="px-4 py-3 text-left">Описание</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(row => {
              const author =
                (typeof row.owner === 'object' && row.owner?.name) ? row.owner.name
                : (typeof row.owner === 'string' ? row.owner
                : '—');

              return (
                <tr
                  key={row._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                  onClick={() => { setEditItem(row); setError(''); }} // редактирование — по клику
                  title="Нажмите, чтобы редактировать"
                >
                  <td className="px-4 py-2">
                    {row.cover ? (
                      <img src={row.cover} alt="" className="h-10 w-10 object-cover rounded-md border" />
                    ) : (
                      <div className="h-10 w-10 rounded-md border flex items-center justify-center text-xs text-gray-400">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium">{row.name || 'Без названия'}</td>
                  <td className="px-4 py-2">{author}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    {row.description ? (row.description.length > 140 ? row.description.slice(0, 140) + '…' : row.description) : '—'}
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  Ничего не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Модалка Создания */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-xl">
            <InventoryForm
              title="Создать инвентаризацию"
              submitText={creating ? 'Создаём…' : 'Создать'}
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
            />
            {/* Примечание: для POST нужен авторизованный пользователь (JWT в Authorization) */}
          </div>
        </div>
      )}

      {/* Модалка Редактирования */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-xl">
            <InventoryForm
              title="Редактировать инвентаризацию"
              submitText={updating ? 'Сохраняем…' : 'Сохранить'}
              initial={{
                name: editItem.name || '',
                description: editItem.description || '',
                cover: editItem.cover || '',
                tags: Array.isArray(editItem.tags) ? editItem.tags.join(', ') : '',
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditItem(null)}
            />
            {/* Примечание: PUT доступен только владельцу/админу; иначе будет 403 */}
          </div>
        </div>
      )}
    </div>
  );
}
