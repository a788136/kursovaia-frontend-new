// src/components/inventory/ItemForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import DocumentPreview from '../shared/DocumentPreview';

// Универсальная форма на основании схемы кастом-полей inventory.fields (массив).
// Поддержка типов: text, number, date, select, textarea, checkbox, markdown, file(s).
// Валидация: required; number — корректное число.

function normalizeFields(schema = []) {
  // Сопоставляем разные возможные названия ключей: key/name, label/title, type/fieldType, options/values
  return (schema || []).map((f, idx) => {
    const key = f.key ?? f.name ?? `field_${idx}`;
    const label = f.label ?? f.title ?? key;
    const type = (f.type ?? f.fieldType ?? 'text').toLowerCase();
    const required = !!f.required;
    const options = f.options ?? f.values ?? [];
    return { key, label, type, required, options, ...f };
  });
}

export default function ItemForm({
  schema = [],          // inventory.fields
  initial = {},         // item.fields (для редактирования)
  onSubmit,             // (values) => Promise | void
  onCancel,
  submitting = false,
}) {
  const fields = useMemo(() => normalizeFields(schema), [schema]);
  const [values, setValues] = useState(() => ({ ...(initial || {}) }));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues({ ...(initial || {}) });
    setErrors({});
  }, [initial]);

  function setVal(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function validate() {
    const e = {};
    for (const f of fields) {
      const v = values[f.key];
      if (f.required && (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0))) {
        e[f.key] = 'Required';
      }
      if (f.type === 'number' && v !== undefined && v !== null && v !== '') {
        const n = Number(v);
        if (Number.isNaN(n)) e[f.key] = 'Must be a number';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit?.(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <label className="block text-sm font-medium">
            {f.label}{f.required && <span className="text-red-600"> *</span>}
          </label>

          {f.type === 'textarea' && (
            <textarea
              className="w-full rounded-xl border px-3 py-2"
              rows={4}
              value={values[f.key] ?? ''}
              onChange={(e) => setVal(f.key, e.target.value)}
            />
          )}

          {f.type === 'markdown' && (
            <DocumentPreview
              mode="markdown"
              value={values[f.key] ?? ''}
              onChange={(val) => setVal(f.key, val)}
            />
          )}

          {f.type === 'select' && (
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={values[f.key] ?? ''}
              onChange={(e) => setVal(f.key, e.target.value)}
            >
              <option value="">—</option>
              {(f.options || []).map((o) => (
                <option key={o?.value ?? o} value={o?.value ?? o}>
                  {o?.label ?? String(o)}
                </option>
              ))}
            </select>
          )}

          {(f.type === 'text' || f.type === 'number' || f.type === 'date') && (
            <input
              type={f.type === 'number' ? 'text' : f.type}
              className="w-full rounded-xl border px-3 py-2"
              value={values[f.key] ?? ''}
              onChange={(e) => setVal(f.key, e.target.value)}
              placeholder={f.placeholder}
            />
          )}

          {f.type === 'checkbox' && (
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded"
                checked={!!values[f.key]}
                onChange={(e) => setVal(f.key, e.target.checked)}
              />
              <span className="text-sm opacity-80">{f.help}</span>
            </label>
          )}

          {(f.type === 'file' || f.type === 'files') && (
            <DocumentPreview
              mode="files"
              value={values[f.key] ?? []}
              multiple={f.type === 'files'}
              onChange={(val) => setVal(f.key, val)}
            />
          )}

          {errors[f.key] && (
            <div className="text-xs text-red-600">{errors[f.key]}</div>
          )}
          {f.help && (
            <div className="text-xs opacity-70">{f.help}</div>
          )}
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          className="rounded-xl border px-4 py-2"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-violet-600 text-white px-4 py-2 disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
