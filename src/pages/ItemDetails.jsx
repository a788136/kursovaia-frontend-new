// src/pages/ItemDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { itemsService } from '../services/itemsService';

export default function ItemDetails({ user }) {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await itemsService.get(itemId);
        if (dead) return;
        setItem(data);
        setForm({ name: data.name || '', description: data.description || '' });
      } catch (e) {
        if (!dead) setError(e?.message || 'Не удалось загрузить айтем');
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [itemId]);

  async function onSave() {
    if (!item) return;
    setSaving(true);
    setError('');
    setConflict(null);
    try {
      const updated = await itemsService.update(item._id, {
        version: item.version,
        name: form.name,
        description: form.description,
      });
      setItem(updated);
      setEdit(false);
    } catch (e) {
      if (e?.response?.status === 409) {
        setConflict(e.response.data?.current || null);
      } else {
        setError(e?.message || 'Не удалось сохранить');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="opacity-70 text-sm">Загрузка…</div>;
  if (!item) return <div className="text-red-600 text-sm">{error || 'Айтем не найден'}</div>;

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xl font-semibold">Айтем</div>
        {!!user && (
          <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
            onClick={() => setEdit(v => !v)}
          >
            {edit ? 'Отмена' : 'Редактировать'}
          </button>
        )}
      </div>

      {!edit ? (
        <div className="rounded-xl border p-4">
          <div className="text-lg font-semibold">{item.name || '—'}</div>
          <div className="mt-2 whitespace-pre-wrap text-sm opacity-80">{item.description || '—'}</div>
          <div className="mt-3 text-xs opacity-60">Версия: {item.version} · Обновлено: {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}</div>
        </div>
      ) : (
        <div className="rounded-xl border p-4">
          <div className="mb-2">
            <label className="block text-sm mb-1">Название</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm mb-1">Описание</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm min-h-[120px]"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              onClick={onSave}
              disabled={saving}
            >
              Сохранить
            </button>
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>

          {conflict && (
            <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
              <div className="font-medium mb-1">Конфликт версий</div>
              <div className="mb-2">Кто-то уже изменил этот айтем. Текущая версия на сервере:</div>
              <div className="font-medium">{conflict.name}</div>
              <div className="opacity-80 whitespace-pre-wrap">{conflict.description}</div>
              <div className="mt-2 text-xs opacity-60">Версия: {conflict.version}</div>
              <button
                className="mt-2 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                onClick={() => { setItem(conflict); setForm({ name: conflict.name || '', description: conflict.description || '' }); setConflict(null); }}
              >
                Подтянуть актуальную версию
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
