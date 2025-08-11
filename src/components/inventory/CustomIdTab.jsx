import React, { useEffect, useMemo, useState } from 'react';

const PALETTE = [
  { type: 'text', label: 'Текст (фикс.)', defaults: { value: 'INV' } },
  { type: 'date', label: 'Дата', defaults: { format: 'YYYYMMDD' } },
  { type: 'seq', label: 'Счётчик', defaults: { pad: 4, scope: 'inventory' } },
  { type: 'guid', label: 'GUID', defaults: {} },
  { type: 'rand32', label: 'Случайное 32‑бит', defaults: {} },
  { type: 'rand6', label: 'Случайное 6 цифр', defaults: {} },
  { type: 'rand9', label: 'Случайное 9 цифр', defaults: {} },
  { type: 'field', label: 'Поле (значение)', defaults: { key: '' } },
];

const uid = () => Math.random().toString(36).slice(2, 9);

function nowFormatted(fmt) {
  const d = new Date();
  const YYYY = String(d.getFullYear());
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  return (fmt || 'YYYYMMDD').replace('YYYY', YYYY).replace('MM', MM).replace('DD', DD);
}
function genGuid() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c / 4)).toString(16)
  );
}
const randDigits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
function rand32() {
  const u = new Uint32Array(1); crypto.getRandomValues(u); return String(u[0]);
}

function ElementCard({ el, onChange, onRemove, onDragStart, onDragOver, onDrop }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
      onDrop={onDrop}
      style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontWeight: 600 }}>{PALETTE.find(p => p.type === el.type)?.label || el.type}</div>
        <button type="button" onClick={onRemove} style={{ color: '#b00020' }}>Удалить</button>
      </div>
      {renderControls(el, onChange)}
    </div>
  );
}

function renderControls(el, onChange) {
  switch (el.type) {
    case 'text':
      return (
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Текст</label>
          <input value={el.value || ''} onChange={(e) => onChange({ ...el, value: e.target.value })} style={{ width: '100%' }} />
        </div>
      );
    case 'date':
      return (
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Формат (YYYY, YYYYMM, YYYYMMDD, ...)</label>
          <input value={el.format || 'YYYYMMDD'} onChange={(e) => onChange({ ...el, format: e.target.value })} style={{ width: '100%' }} />
        </div>
      );
    case 'seq':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={{ fontSize: 12, color: '#666' }}>Длина (pad)</label>
            <input
              type="number"
              min={1}
              max={12}
              value={el.pad || 4}
              onChange={(e) => onChange({ ...el, pad: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666' }}>Область</label>
            <select value={el.scope || 'inventory'} onChange={(e) => onChange({ ...el, scope: e.target.value })} style={{ width: '100%' }}>
              <option value="inventory">Для инвентаризации</option>
              <option value="global">Глобально</option>
            </select>
          </div>
        </div>
      );
    case 'field':
      return (
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Ключ поля</label>
          <input
            value={el.key || ''}
            onChange={(e) => onChange({ ...el, key: e.target.value })}
            placeholder="например, brand"
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            В предпросмотре подставится значение из «Пример полей» справа.
          </div>
        </div>
      );
    default:
      return <div style={{ fontSize: 12, color: '#666' }}>Без параметров</div>;
  }
}

function previewSample(format, sampleFields) {
  if (!format || !Array.isArray(format.elements)) return '';
  const parts = [];
  for (const el of format.elements) {
    switch (el.type) {
      case 'text': parts.push(el.value || ''); break;
      case 'date': parts.push(nowFormatted(el.format)); break;
      case 'seq': parts.push(String(1).padStart(el.pad || 4, '0')); break;
      case 'guid': parts.push(genGuid()); break;
      case 'rand32': parts.push(rand32()); break;
      case 'rand6': parts.push(randDigits(6)); break;
      case 'rand9': parts.push(randDigits(9)); break;
      case 'field': parts.push(sampleFields?.[el.key] ?? `{${el.key || 'field'}}`); break;
      default: parts.push('');
    }
    if (format.separator && el !== format.elements[format.elements.length - 1]) parts.push(format.separator);
  }
  return parts.join('');
}

function KeyValueEditor({ value, onChange, readOnly }) {
  const [pairs, setPairs] = useState(() => Object.entries(value || {}));
  useEffect(() => { setPairs(Object.entries(value || {})); }, [value]);
  const update = (i, k, v) => {
    const next = pairs.map((p, idx) => (idx === i ? [k, v] : p));
    setPairs(next); onChange?.(Object.fromEntries(next));
  };
  const add = () => {
    const next = [...pairs, ['', '']]; setPairs(next); onChange?.(Object.fromEntries(next));
  };
  const remove = (i) => {
    const next = pairs.filter((_, idx) => idx !== i); setPairs(next); onChange?.(Object.fromEntries(next));
  };
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {pairs.map(([k, v], i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
          <input value={k} onChange={(e) => update(i, e.target.value, v)} readOnly={readOnly} placeholder="ключ" />
          <input value={v} onChange={(e) => update(i, k, e.target.value)} readOnly={readOnly} placeholder="значение" />
          {!readOnly && <button type="button" onClick={() => remove(i)} style={{ color: '#b00020' }}>×</button>}
        </div>
      ))}
      {!readOnly && <button type="button" onClick={add}>+ Пара</button>}
    </div>
  );
}

export default function CustomIDTab({ value, onChange, onSave, disabled, sampleFields }) {
  const [dragIdx, setDragIdx] = useState(null);
  const cfg = value || { enabled: true, separator: '-', elements: [] };

  const addElement = (type) => {
    const def = PALETTE.find((p) => p.type === type)?.defaults || {};
    onChange?.({ ...cfg, elements: [...(cfg.elements || []), { id: uid(), type, ...def }] });
  };
  const updateAt = (i, patch) => {
    const next = [...cfg.elements]; next[i] = patch; onChange?.({ ...cfg, elements: next });
  };
  const removeAt = (i) => onChange?.({ ...cfg, elements: cfg.elements.filter((_, idx) => idx !== i) });

  const errors = useMemo(() => {
    const errs = [];
    (cfg.elements || []).forEach((el, i) => {
      if (el.type === 'text' && !('value' in el)) errs.push(`Элемент #${i + 1}: пустой текст`);
      if (el.type === 'field' && !el.key) errs.push(`Элемент #${i + 1}: не указан ключ поля`);
      if (el.type === 'seq' && (el.pad || 0) <= 0) errs.push(`Элемент #${i + 1}: длина счётчика должна быть > 0`);
    });
    return errs;
  }, [cfg]);

  const preview = useMemo(() => previewSample(cfg, sampleFields), [cfg, sampleFields]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8 }}>
        {PALETTE.map((p) => (
          <button key={p.type} type="button" disabled={disabled} onClick={() => addElement(p.type)} title="Добавить элемент">
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label>Разделитель</label>
            <input
              value={cfg.separator || ''}
              onChange={(e) => onChange?.({ ...cfg, separator: e.target.value })}
              placeholder="- или _"
              style={{ width: 120 }}
            />
            <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginLeft: 8, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={!!cfg.enabled}
                onChange={(e) => onChange?.({ ...cfg, enabled: e.target.checked })}
              />
              Активно
            </label>
          </div>

          {(cfg.elements || []).length ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {cfg.elements.map((el, i) => (
                <ElementCard
                  key={el.id || i}
                  el={el}
                  onChange={(nel) => updateAt(i, nel)}
                  onRemove={() => removeAt(i)}
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={() => {}}
                  onDrop={() => {
                    if (dragIdx == null || dragIdx === i) return;
                    const next = [...cfg.elements];
                    const [m] = next.splice(dragIdx, 1);
                    next.splice(i, 0, m);
                    setDragIdx(null);
                    onChange?.({ ...cfg, elements: next });
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 14, color: '#666' }}>Добавьте элементы формата выше.</div>
          )}
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Предпросмотр</div>
          <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 20, wordBreak: 'break-all' }}>
            {preview || '—'}
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Пример полей (для блока «Поле»)</div>
            <KeyValueEditor value={sampleFields} onChange={() => {}} readOnly />
          </div>
        </div>
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

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={() => onSave?.(cfg)} disabled={disabled || !!errors.length}>
          Сохранить
        </button>
        <div style={{ fontSize: 12, color: '#666' }}>HTML5 drag‑and‑drop. Предпросмотр локальный.</div>
      </div>
    </div>
  );
}
