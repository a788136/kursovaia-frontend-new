// src/components/inventory/FieldsTab.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

const TYPE_LIMITS = { shortText: 3, longText: 3, number: 3, link: 3, checkbox: 3 };
const TYPE_LABEL  = { shortText: 'Строка', longText: 'Текст', number: 'Число', link: 'Ссылка', checkbox: 'Флажок' };
const MAX_TOTAL   = 15;

const keyOk = (k) => /^[a-z][a-z0-9_]*$/i.test(k);
const uid   = () => Math.random().toString(36).slice(2, 9);

// простой i18n только для бейджей/кнопки
const I18N = {
  ru: {
    saving: 'Сохранение…',
    saved: 'Все изменения сохранены',
    problems: 'Проблемы:',
    save: 'Сохранить',
    hint: 'Перетаскивай карточки для сортировки. Лимиты применяются сразу.',
    type: 'Тип',
    key: 'Ключ*',
    label: 'Название',
    showInTable: 'В таблице',
    placeholderKey: 'latin, unique',
    placeholderLabel: 'Отображаемое имя',
    tooltip: 'Tooltip / подсказка',
    delete: 'Удалить',
    helper: 'Подсказка',
  },
  en: {
    saving: 'Saving…',
    saved: 'All changes saved',
    problems: 'Issues:',
    save: 'Save',
    hint: 'Drag cards to reorder. Limits apply immediately.',
    type: 'Type',
    key: 'Key*',
    label: 'Label',
    showInTable: 'In table',
    placeholderKey: 'latin, unique',
    placeholderLabel: 'Display name',
    tooltip: 'Tooltip',
    delete: 'Delete',
    helper: 'Hint',
  },
};

function FieldRow({ L, field, onChange, onRemove, onDragStart, onDragOver, onDrop }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
      onDrop={onDrop}
      style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12, background: '#fff' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>{L.type}</div>
          <div style={{ fontWeight: 600 }}>{TYPE_LABEL[field.type]}</div>
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>{L.key}</label>
          <input
            value={field.key}
            onChange={(e) => onChange({ ...field, key: e.target.value }, { immediate: false })}
            placeholder={L.placeholderKey}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>{L.label}</label>
          <input
            value={field.label || ''}
            onChange={(e) => onChange({ ...field, label: e.target.value }, { immediate: false })}
            placeholder={L.placeholderLabel}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ textAlign: 'right' }}>
          <label style={{ fontSize: 12, color: '#666', display: 'block' }}>{L.showInTable}</label>
          <input
            type="checkbox"
            checked={!!field.showInTable}
            onChange={(e) => onChange({ ...field, showInTable: e.target.checked }, { immediate: true })}
          />
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: 12, color: '#666' }}>{L.helper}</label>
        <textarea
          value={field.hint || ''}
          onChange={(e) => onChange({ ...field, hint: e.target.value }, { immediate: false })}
          placeholder={L.tooltip}
          rows={2}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <button type="button" onClick={onRemove} style={{ color: '#b00020' }}>
          {L.delete}
        </button>
      </div>
    </div>
  );
}

export default function FieldsTab({ value, onChange, onSave, disabled }) {
  const lang = (localStorage.getItem('lang') || 'ru').toLowerCase().startsWith('en') ? 'en' : 'ru';
  const L = I18N[lang];

  const [dragIndex, setDragIndex] = useState(null);
  const fields = value || [];

  // --- AUTOSAVE state/refs ---
  const [savingState, setSavingState] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const saveTimer = useRef(null);
  const isComposingRef = useRef(false);
  const fieldsRef = useRef(fields);
  useEffect(() => { fieldsRef.current = fields; }, [fields]);

  // IME guard — не стартуем таймер во время набора составных символов
  useEffect(() => {
    const onStart = () => { isComposingRef.current = true; };
    const onEnd   = () => { isComposingRef.current = false; };
    window.addEventListener('compositionstart', onStart);
    window.addEventListener('compositionend', onEnd);
    return () => {
      window.removeEventListener('compositionstart', onStart);
      window.removeEventListener('compositionend', onEnd);
    };
  }, []);

  // Планировщик сохранений:
  // - immediate: для дискретных действий (add/remove/reorder/checkbox) — микро-дебаунс 300ms
  // - debounced (immediate:false): для набора текста — дебаунс 1000ms
  const doSave = async () => {
    if (!onSave || disabled) return;
    try {
      setSavingState('saving');
      const toSave = fieldsRef.current;
      await onSave(toSave);
      setSavingState('saved');
      setTimeout(() => setSavingState('idle'), 1200);
    } catch {
      setSavingState('idle'); // ошибку показывает родитель
    }
  };

  const scheduleSave = ({ immediate = false } = {}) => {
    if (!onSave || disabled) return;
    clearTimeout(saveTimer.current);
    if (immediate) {
      // маленький коалесцирующий промежуток
      saveTimer.current = setTimeout(doSave, 300);
    } else {
      if (isComposingRef.current) return; // во время IME не ставим
      saveTimer.current = setTimeout(doSave, 1000);
    }
  };

  // ---- подсчёты/валидация как было ----
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
    scheduleSave({ immediate: true });
  };

  const removeAt = (i) => {
    onChange?.(fields.filter((_, idx) => idx !== i));
    scheduleSave({ immediate: true });
  };

  const updateAt = (i, patch, opts = { immediate: false }) => {
    onChange?.(fields.map((f, idx) => (idx === i ? patch : f)));
    scheduleSave({ immediate: !!opts.immediate });
  };

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

  // ручное сохранение — синхронизируем бейджи
  const manualSave = async () => {
    await doSave();
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Шапка с бейджем состояния сохранения */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Поля</div>
        {savingState === 'saved' && (
          <span style={{
            fontSize: 12, background: '#E8F5E9', color: '#1B5E20',
            padding: '4px 10px', borderRadius: 999
          }}>
            {L.saved}
          </span>
        )}
        {savingState === 'saving' && (
          <span style={{
            fontSize: 12, background: '#FFF3E0', color: '#E65100',
            padding: '4px 10px', borderRadius: 999
          }}>
            {L.saving}
          </span>
        )}
      </div>

      {/* Кнопки добавления типов */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Object.keys(TYPE_LABEL).map((t) => (
          <button key={t} type="button" disabled={!canAdd(t) || disabled} onClick={() => addField(t)}>
            + {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {!!errors.length && (
        <div style={{ border: '1px solid #f5c2c7', background: '#f8d7da', padding: 12, borderRadius: 8, color: '#842029' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{L.problems}</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Список полей */}
      <div style={{ display: 'grid', gap: 10 }}>
        {fields.map((f, i) => (
          <FieldRow
            key={f.id || i}
            L={L}
            field={f}
            onChange={(nf, opts) => updateAt(i, nf, opts)}
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
              scheduleSave({ immediate: true });
            }}
          />
        ))}
      </div>

      {/* При необходимости вернёшь ручную кнопку */}
      {/* <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={manualSave} disabled={disabled || !!errors.length}>
          {L.save}
        </button>
        <div style={{ fontSize: 12, color: '#666' }}>{L.hint}</div>
      </div> */}
    </div>
  );
}
