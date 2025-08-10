// src/components/InventoryForm.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

// Простая валидация
const validators = {
  name: (v) => {
    if (!v || !v.trim()) return 'Название обязательно';
    const len = v.trim().length;
    if (len < 3) return 'Минимум 3 символа';
    if (len > 100) return 'Максимум 100 символов';
    return null;
  },
  description: (v) => {
    if (!v) return null;
    if (v.length > 500) return 'Описание не должно превышать 500 символов';
    return null;
  },
  cover: (v) => {
    if (!v) return null;
    try {
      const u = new URL(v);
      if (!/^https?:$/.test(u.protocol)) return 'Только http/https';
      return null;
    } catch {
      return 'Некорректный URL';
    }
  },
  tags: (v) => {
    if (!v) return null;
    const arr = v.split(',').map(s => s.trim()).filter(Boolean);
    if (arr.length > 10) return 'Не более 10 тегов';
    for (const t of arr) {
      if (t.length < 2) return 'Тег минимум 2 символа';
      if (t.length > 30) return 'Тег максимум 30 символов';
      if (!/^[\p{L}\p{N}\-_ ]+$/u.test(t)) return 'Теги: буквы/цифры/пробел/-/_';
    }
    return null;
  },
};

function useFormState(initial) {
  // Инициализируем один раз
  const [values, setValues] = useState(() => initial);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateAll = () => {
    const next = {};
    for (const [key, val] of Object.entries(values)) {
      if (validators[key]) {
        const err = validators[key](val);
        if (err) next[key] = err;
      }
    }
    setErrors(next);
    return next;
  };

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues(v => ({ ...v, [name]: value }));
    if (validators[name]) {
      const err = validators[name](value);
      setErrors(prev => {
        const copy = { ...prev };
        if (err) copy[name] = err; else delete copy[name];
        return copy;
      });
    }
  };

  const onBlur = (e) => {
    const { name } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
  };

  return { values, setValues, errors, setErrors, touched, setTouched, validateAll, isValid, onChange, onBlur };
}

export default function InventoryForm({
  initial,                 // ← больше НЕТ дефолт-объекта здесь
  onSubmit,
  onCancel,
  submitText = 'Сохранить',
  title = 'Инвентаризация',
}) {
  // Стабильный пустой initial для режима создания
  const blankRef = useRef({ name: '', description: '', cover: '', tags: '' });
  const safeInitial = initial ?? blankRef.current;

  const { values, setValues, errors, validateAll, isValid, onChange, onBlur } = useFormState(safeInitial);

  // Сбрасываем значения ТОЛЬКО когда действительно пришёл новый initial (режим редактирования)
  useEffect(() => {
    if (initial) setValues(initial);
  }, [initial, setValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateAll();
    if (Object.keys(errs).length > 0) return;

    // Преобразуем строку тегов в массив
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || '',
      cover: values.cover?.trim() || '',
      tags: values.tags
        ? values.tags.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    };

    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {title && <h3 className="text-xl font-semibold">{title}</h3>}

      <div>
        <label className="block text-sm mb-1">Название *</label>
        <input
          type="text"
          name="name"
          value={values.name}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full border rounded-lg px-3 py-2 outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Например: Коллекция книг"
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm mb-1">Описание</label>
        <textarea
          name="description"
          value={values.description}
          onChange={onChange}
          onBlur={onBlur}
          rows={4}
          className={`w-full border rounded-lg px-3 py-2 outline-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Короткое описание до 500 символов"
        />
        {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm mb-1">Обложка (URL)</label>
        <input
          type="url"
          name="cover"
          value={values.cover}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full border rounded-lg px-3 py-2 outline-none ${errors.cover ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="https://example.com/image.jpg"
        />
        {errors.cover && <p className="text-red-600 text-sm mt-1">{errors.cover}</p>}
      </div>

      <div>
        <label className="block text-sm mb-1">Теги (через запятую)</label>
        <input
          type="text"
          name="tags"
          value={values.tags}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full border rounded-lg px-3 py-2 outline-none ${errors.tags ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="книги, история, фантастика"
        />
        {errors.tags && <p className="text-red-600 text-sm mt-1">{errors.tags}</p>}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
          {submitText}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border">
          Отмена
        </button>
      </div>
    </form>
  );
}
