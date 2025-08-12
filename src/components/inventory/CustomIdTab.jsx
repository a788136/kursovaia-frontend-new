// src/components/inventory/CustomIdTab.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Schema we use here:
 * value = {
 *   enabled: true,
 *   elements: [
 *     { id, type: 'fixed', value: '📚-' },
 *     { id, type: 'rand20', fmt: 'X5_' },   // X5_ (5-hex) или D6_ (6-цифр)
 *     { id, type: 'seq',   fmt: 'D3'  },    // D3 (3 цифры с ведущими нулями) или D (без нулей)
 *     { id, type: 'date',  fmt: 'yyyy' }    // формат даты
 *   ]
 * }
 */

const TYPE_OPTIONS = [
  { value: "fixed", label: "Fixed" },
  { value: "rand20", label: "20-bit random" },
  { value: "seq", label: "Sequence" },
  { value: "date", label: "Date/time" },
];

const DESCR = {
  fixed: "A piece of unchanging text. E.g., you can use Unicode emoji.",
  rand20:
    "A random value. E.g., format as a six-digit decimal (D6) or 5-digit hex (X5).",
  seq: "A sequential index. E.g., format with leading zeros (D4) or without them (D).",
  date:
    "An item creation date and time. E.g., use an abbreviated day of the week (ddd).",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function normalizeInitial(val) {
  // Поддержка старых схем из ранней версии
  if (!val) return { enabled: true, elements: [] };
  const elements = (val.elements || []).map((el) => {
    if (el.type === "text")  return { id: el.id || uid(), type: "fixed", value: el.value || "" };
    if (el.type === "rand32")return { id: el.id || uid(), type: "rand20", fmt: "X5_" };
    if (el.type === "seq")   return { id: el.id || uid(), type: "seq", fmt: el.pad ? `D${el.pad}` : "D" };
    if (el.type === "date")  return { id: el.id || uid(), type: "date", fmt: el.format || "yyyy" };
    return { id: el.id || uid(), ...el };
  });
  return { enabled: !!val.enabled, elements };
}

/* ---------- helpers to preview ---------- */

function hexFrom20bit() {
  // 20 бит = 5 hex-символов
  const n = crypto.getRandomValues(new Uint32Array(1))[0] & 0xFFFFF;
  return n.toString(16).toUpperCase().padStart(5, "0");
}
function decFrom20bit(len = 6) {
  // 20 бит максимум ~ 1,048,575 => до 6 десятичных знаков
  const n = crypto.getRandomValues(new Uint32Array(1))[0] & 0xFFFFF;
  return String(n).padStart(len, "0").slice(0, len);
}
function seqPreview(fmt = "D3") {
  const m = /^D(\d+)?$/.exec(fmt);
  if (!m) return "1";
  const pad = Number(m[1] || 0);
  return pad > 0 ? String(13).padStart(pad, "0") : "13";
}
function datePreview(fmt = "yyyy") {
  const d = new Date();
  const map = {
    yyyy: d.getFullYear().toString(),
    yy: d.getFullYear().toString().slice(-2),
    MM: String(d.getMonth() + 1).padStart(2, "0"),
    M: String(d.getMonth() + 1),
    dd: String(d.getDate()).padStart(2, "0"),
    d: String(d.getDate()),
    ddd: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
  };
  let out = fmt;
  // простая замена популярных токенов
  for (const [k, v] of Object.entries(map)) out = out.replaceAll(k, v);
  return out;
}
function rand20Preview(fmt = "X5_") {
  if (/^X5_?$/i.test(fmt)) return hexFrom20bit() + (fmt.endsWith("_") ? "_" : "");
  const m = /^D(\d+)_?$/i.exec(fmt);
  if (m) return decFrom20bit(Number(m[1] || 6)) + (fmt.endsWith("_") ? "_" : "");
  return hexFrom20bit();
}

function renderPreview(elements) {
  const parts = [];
  for (const el of elements || []) {
    switch (el.type) {
      case "fixed":
        parts.push(el.value || "");
        break;
      case "rand20":
        parts.push(rand20Preview(el.fmt || "X5_"));
        break;
      case "seq":
        parts.push(seqPreview(el.fmt || "D3"));
        break;
      case "date":
        parts.push(datePreview(el.fmt || "yyyy"));
        break;
      default:
        parts.push("");
    }
  }
  return parts.join("");
}

/* ---------- Row component ---------- */

function Row({
  el,
  onChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div
      className="rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm p-3"
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e);
      }}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2">
        {/* drag handle */}
        <button
          type="button"
          className="cursor-grab text-zinc-500 px-2"
          title="Drag to reorder"
        >
          ↕
        </button>

        {/* type select */}
        <select
          className="rounded-xl border px-3 py-2 min-w-[180px]"
          value={el.type}
          onChange={(e) => {
            const t = e.target.value;
            if (t === "fixed") onChange({ id: el.id, type: t, value: "" });
            if (t === "rand20") onChange({ id: el.id, type: t, fmt: "X5_" });
            if (t === "seq") onChange({ id: el.id, type: t, fmt: "D3" });
            if (t === "date") onChange({ id: el.id, type: t, fmt: "yyyy" });
          }}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* value / fmt input */}
        {el.type === "fixed" ? (
          <input
            className="flex-1 rounded-xl border px-3 py-2"
            placeholder="e.g. 📚-"
            value={el.value || ""}
            onChange={(e) => onChange({ ...el, value: e.target.value })}
          />
        ) : (
          <input
            className="flex-1 rounded-xl border px-3 py-2"
            placeholder={
              el.type === "rand20"
                ? "X5_ or D6_"
                : el.type === "seq"
                ? "D3 or D"
                : "yyyy"
            }
            value={el.fmt || ""}
            onChange={(e) => onChange({ ...el, fmt: e.target.value })}
          />
        )}

        {/* emoji quick insert for Fixed */}
        <button
          type="button"
          className="rounded-xl border px-2 py-2"
          title="Insert emoji"
          onClick={() =>
            el.type === "fixed" &&
            onChange({ ...el, value: (el.value || "") + "📚" })
          }
        >
          😊
        </button>

        {/* help */}
        <button
          type="button"
          className="rounded-xl border px-2 py-2"
          title="Help"
          onClick={() => setShowHelp((s) => !s)}
        >
          ?
        </button>

        {/* remove */}
        <button
          type="button"
          className="text-red-600 px-2"
          onClick={onRemove}
          title="Delete"
        >
          ✕
        </button>
      </div>

      {/* description/help */}
      <div className="mt-2 text-sm text-zinc-500">
        {DESCR[el.type]}
        {showHelp && (
          <span className="ml-2 italic opacity-80">
            {el.type === "rand20"
              ? "X5 = 5 hex chars (20-bit). D6 = 6 digits (with leading zeros). Optional trailing '_' to add underscore."
              : el.type === "seq"
              ? "Use D + digits for left-padded decimal (e.g., D4). Plain 'D' for no padding."
              : el.type === "date"
              ? "Common tokens: yyyy, yy, MM, dd, ddd."
              : "Free text; emoji allowed."}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- Main component ---------- */

export default function CustomIdTab({
  value,
  onChange,
  onSave,
  disabled,
}) {
  const [cfg, setCfg] = useState(() => normalizeInitial(value));
  const [dragIdx, setDragIdx] = useState(null);
  const [savingState, setSavingState] = useState("idle"); // 'idle' | 'saving' | 'saved'
  const saveTimer = useRef(null);
  const isComposingRef = useRef(false);

  // sync external value (избегаем лишних ресетов по deep-равенству)
  useEffect(() => {
    setCfg((prev) => {
      const ext = JSON.stringify(value || {});
      const cur = JSON.stringify(prev || {});
      if (ext === cur) return prev;
      return normalizeInitial(value);
    });
  }, [value]);

  // глобально отслеживаем составной ввод (IME), чтобы не сохранять во время набора
  useEffect(() => {
    const onStart = () => { isComposingRef.current = true; };
    const onEnd   = () => { isComposingRef.current = false; };
    window.addEventListener("compositionstart", onStart);
    window.addEventListener("compositionend", onEnd);
    return () => {
      window.removeEventListener("compositionstart", onStart);
      window.removeEventListener("compositionend", onEnd);
    };
  }, []);

  // прокидываем изменения наружу + автосейв с дебаунсом (7.5s)
  useEffect(() => {
    onChange?.(cfg);

    if (!onSave) return;
    clearTimeout(saveTimer.current);

    // пауза на время набора
    if (isComposingRef.current) return;

    // НЕ показываем "Saving…" заранее. Покажем только когда начнётся реальный запрос.
    saveTimer.current = setTimeout(async () => {
      try {
        setSavingState("saving");
        await onSave(cfg);
        setSavingState("saved");
        setTimeout(() => setSavingState("idle"), 1200);
      } catch {
        setSavingState("idle");
      }
    }, 7500); // 7.5 секунд после последнего изменения

    return () => clearTimeout(saveTimer.current);
  }, [cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateAt(i, patch) {
    const next = [...cfg.elements];
    next[i] = patch;
    setCfg({ ...cfg, elements: next });
  }
  function removeAt(i) {
    setCfg({ ...cfg, elements: cfg.elements.filter((_, idx) => idx !== i) });
  }
  function addElement() {
    setCfg({
      ...cfg,
      elements: [...cfg.elements, { id: uid(), type: "fixed", value: "" }],
    });
  }

  const preview = useMemo(() => renderPreview(cfg.elements), [cfg.elements]);

  return (
    <div className="space-y-5">
      {/* Header with saved state */}
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">Custom ID</div>
        {savingState === "saved" && (
          <span className="text-xs rounded-full bg-green-100 text-green-700 px-3 py-1">
            All changes saved
          </span>
        )}
        {savingState === "saving" && (
          <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-3 py-1">
            Saving…
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-600">
        You can set up items with inventory numbers in your preferred format.
        To create a format, add new elements, edit them, drag to reorder, or
        drag elements out of the form to delete them.
      </p>

      <div className="text-sm">
        <span className="opacity-60 mr-2">Example:</span>
        <span className="font-mono text-lg break-all">{preview || "—"}</span>
      </div>

      <div className="grid gap-3">
        {cfg.elements.map((el, i) => (
          <Row
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
              setCfg({ ...cfg, elements: next });
            }}
          />
        ))}
      </div>

      <div>
        <button
          type="button"
          className="rounded-xl border px-4 py-2 text-violet-600 hover:bg-violet-50 disabled:opacity-50"
          onClick={addElement}
          disabled={disabled}
        >
          Add element
        </button>
      </div>
    </div>
  );
}
