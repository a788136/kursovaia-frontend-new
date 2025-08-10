// src/pages/InventoryDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';

export default function InventoryDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await inventoryService.getById(id);
        setItem(data);
      } catch (e) {
        console.error(e);
        setErr(e?.response?.data?.error || 'Не удалось загрузить инвентаризацию');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const canEdit = !!user && (
    user.isAdmin === true ||
    String(user.id || user._id) === String(item?.owner_id)
  );

  const title = item?.name || item?.title || 'Инвентаризация';
  const cover = item?.cover || item?.image || '';
  const tags = Array.isArray(item?.tags) ? item.tags : [];

  if (loading) return <div className="text-gray-500">Загрузка...</div>;
  if (err) return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="px-3 py-1.5 border rounded-lg">&larr; Назад</button>
      <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 px-4 py-2">{err}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="px-3 py-1.5 border rounded-lg">&larr; Назад</button>
        {canEdit && (
          <Link
            to={`/inventories/${id}/edit`}
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Редактировать
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-28 h-28 flex-shrink-0">
            {cover ? (
              <img src={cover} alt="" className="w-28 h-28 object-cover rounded-xl border" />
            ) : (
              <div className="w-28 h-28 rounded-xl border flex items-center justify-center text-sm text-gray-400">Нет фото</div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{item?.description || 'Нет описания'}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {tags.length ? tags.map(t => (
                <span key={t} className="px-2 py-1 text-xs rounded-full border">{t}</span>
              )) : <span className="text-sm text-gray-400">Без тегов</span>}
            </div>

            <div className="mt-4 text-sm text-gray-500">
              <div><span className="text-gray-400">ID:</span> {item?._id}</div>
              {item?.owner_id && <div><span className="text-gray-400">Владелец:</span> {String(item.owner_id)}</div>}
              {item?.updatedAt && <div><span className="text-gray-400">Обновлено:</span> {new Date(item.updatedAt).toLocaleString()}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
