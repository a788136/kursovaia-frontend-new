// src/pages/InventoryEdit.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';
import InventoryForm from '../components/InventoryForm';

export default function InventoryEdit({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleUpdate = async (payload) => {
    setSaving(true);
    setErr('');
    try {
      await inventoryService.update(id, payload); // требует валидный JWT + права
      navigate(`/inventories/${id}`, { replace: true });
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.error || 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500">Загрузка...</div>;
  if (!item) return <div className="text-red-600">Инвентаризация не найдена</div>;
  if (!canEdit) return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="px-3 py-1.5 border rounded-lg">&larr; Назад</button>
      <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 px-4 py-2">Доступ запрещён</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="px-3 py-1.5 border rounded-lg">&larr; Назад</button>
        <div className="text-2xl font-semibold">Редактировать инвентаризацию</div>
      </div>

      {err && <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 px-4 py-2">{err}</div>}

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <InventoryForm
          submitText={saving ? 'Сохраняем…' : 'Сохранить'}
          initial={{
            name: item?.name || item?.title || '',
            description: item?.description || '',
            cover: item?.cover || item?.image || '',
            tags: Array.isArray(item?.tags) ? item.tags.join(', ') : '',
          }}
          onSubmit={handleUpdate}
          onCancel={() => navigate(`/inventories/${id}`)}
        />
      </div>
    </div>
  );
}
