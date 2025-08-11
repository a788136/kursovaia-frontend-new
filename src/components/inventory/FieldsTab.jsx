import React, { useMemo, useState } from 'react';

const TYPE_LIMITS = { shortText: 3, longText: 3, number: 3, link: 3, checkbox: 3 };
const TYPE_LABEL = { shortText: 'Строка', longText: 'Текст', number: 'Число', link: 'Ссылка', checkbox: 'Флажок' };
const MAX_TOTAL = 15;

const keyOk = (k) => /^[a-z][a-z0-9_]*$/i.test(k);
const uid = () => Math.random().toString(36).slice(2, 9);

function FieldRow({ field, onChange, onRemove, onDragStart, onDragOver, onDrop }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
      onDrop={onDrop}
      style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Тип</div>
          <div style={{ fontWeight: 600 }}>{TYPE_LABEL[field.type]}</div>
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Ключ*</label>
          <input
            value={field.key}
            onChange={(e) => onChange({ ...field, key: e.target.value })}
            placeholder="latin, unique"
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Название</label>
          <input
            value={field.label || ''}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
            placeholder="Отображаемое имя"
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ textAlign: 'right' }}>
          <label style={{ fontSize: 12, color: '#666', display: 'block' }}>В таблице</label>
          <input
            type="checkbox"
            checked={!!field.showInTable}
            onChange={(e) => onChange({ ...field, showInTable: e.target.checked })}
          />
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: 12, color: '#666' }}>Подсказка</label>
        <textarea
          value={field.hint || ''}
          onChange={(e) => onChange({ ...field, hint: e.target.value })}
          placeholder="Tooltip / подсказка"
          rows={2}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <button type="button" onClick={onRemove} style={{ color: '#b00020' }}>
          Удалить
        </button>
      </div>
    </div>
  );
}

export default function FieldsTab({ value, onChange, onSave, disabled }) {
  const [dragIndex, setDragIndex] = useState(null);
  const fields = value || [];

  const counts = useMemo(
    () => fields.reduce((acc, f) => ((acc[f.type] = (acc[f.type] || 0) + 1), acc), {}),
    [fields]
  );
  const total = fields.length;

  const canAdd = (type) => total < MAX_TOTAL && (counts[type] || 0) < TYPE_LIMITS[type];

  const addField = (type) => {
    if (!canAdd(type)) return;
    const key = `${type}_${uid()}`;
    onChange?.([...fields, { id: uid(), type, key, label: '', showInTable: false, hint: '' }]);
  };

  const removeAt = (i) => onChange?.(fields.filter((_, idx) => idx !== i));
  const updateAt = (i, patch) => onChange?.(fields.map((f, idx) => (idx === i ? patch : f)));

  const errors = useMemo(() => {
    const errs = [];
    const keys = new Set();
    for (const f of fields) {
      if (!f.key || !keyOk(f.key)) errs.push(`Неверный ключ у поля «${f.label || f.key || f.type}»`);
      if (keys.has(f.key)) errs.push(`Ключ «${f.key}» повторяется`);
      keys.add(f.key);
    }
    for (const t of Object.keys(TYPE_LIMITS)) {
      const c = counts[t] || 0;
      if (c > TYPE_LIMITS[t]) errs.push(`Лимит для типа ${TYPE_LABEL[t]}: ${TYPE_LIMITS[t]}`);
    }
    if (total > MAX_TOTAL) errs.push(`Слишком много полей (>${MAX_TOTAL})`);
    return errs;
  }, [fields, counts, total]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Object.keys(TYPE_LABEL).map((t) => (
          <button key={t} type="button" disabled={!canAdd(t) || disabled} onClick={() => addField(t)}>
            + {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {!!errors.length && (
        <div style={{ border: '1px solid #f5c2c7', background: '#f8d7da', padding: 12, borderRadius: 8, color: '#842029' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Проблемы:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {fields.map((f, i) => (
          <FieldRow
            key={f.id || i}
            field={f}
            onChange={(nf) => updateAt(i, nf)}
            onRemove={() => removeAt(i)}
            onDragStart={() => setDragIndex(i)}
            onDragOver={() => {}}
            onDrop={() => {
              if (dragIndex == null || dragIndex === i) return;
              const next = [...fields];
              const [moved] = next.splice(dragIndex, 1);
              next.splice(i, 0, moved);
              setDragIndex(null);
              onChange?.(next);
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={() => onSave?.(fields)} disabled={disabled || !!errors.length}>
          Сохранить
        </button>
        <div style={{ fontSize: 12, color: '#666' }}>Перетаскивай карточки для сортировки. Лимиты применяются сразу.</div>
      </div>
    </div>
  );
}
