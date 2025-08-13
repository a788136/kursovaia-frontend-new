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

// ---- i18n ----
const I18N = {
  ru: {
    title: "Пользовательский ID",
    savedBadge: "Все изменения сохранены",
    savingBadge: "Сохранение…",
    intro:
      "Вы можете настроить инвентарные номера в удобном формате. Чтобы собрать формат, добавляйте элементы, редактируйте их, тяните для изменения порядка или перетаскивайте за пределы формы, чтобы удалить.",
    example: "Пример:",
    addElement: "Добавить элемент",
    placeholders: {
      fixed: "напр. 📚-",
      rand20: "X5_ или D6_",
      seq: "D3 или D",
      date: "yyyy",
    },
    titles: {
      drag: "Перетащите для изменения порядка",
      insertEmoji: "Вставить эмодзи",
      help: "Справка",
      delete: "Удалить",
    },
    typeLabels: {
      fixed: "Фиксированный текст",
      rand20: "20-битный рандом",
      seq: "Счётчик",
      date: "Дата/время",
    },
    descr: {
      fixed:
        "Неизменяемый кусочек текста. Можно использовать Unicode-эмодзи.",
      rand20:
        "Случайное значение. Например, шесть десятичных (D6) или 5 шестнадцатеричных (X5).",
      seq: "Последовательный индекс. С ведущими нулями (D4) или без них (D).",
      date:
        "Дата/время создания. Например, сокращённый день недели (ddd).",
    },
    helpTail: {
      rand20:
        "X5 = 5 hex-символов (20 бит). D6 = 6 цифр (с ведущими нулями). Необязательный '_' в конце добавит подчёркивание.",
      seq: "Используйте D + число для десятичного с нулями (напр., D4). Просто 'D' — без нулей.",
      date: "Частые токены: yyyy, yy, MM, dd, ddd.",
      fixed: "Свободный текст; эмодзи разрешены.",
    },
  },
  en: {
    title: "Custom ID",
    savedBadge: "All changes saved",
    savingBadge: "Saving…",
    intro:
      "Set up inventory numbers in your preferred format. Add elements, edit them, drag to reorder, or drag items out of the form to delete.",
    example: "Example:",
    addElement: "Add element",
    placeholders: {
      fixed: "e.g. 📚-",
      rand20: "X5_ or D6_",
      seq: "D3 or D",
      date: "yyyy",
    },
    titles: {
      drag: "Drag to reorder",
      insertEmoji: "Insert emoji",
      help: "Help",
      delete: "Delete",
    },
    typeLabels: {
      fixed: "Fixed",
      rand20: "20-bit random",
      seq: "Sequence",
      date: "Date/time",
    },
    descr: {
      fixed:
        "A piece of unchanging text. You can use Unicode emoji.",
      rand20:
        "A random value. E.g., six-digit decimal (D6) or five-digit hex (X5).",
      seq: "A sequential index. With leading zeros (D4) or without them (D).",
      date:
        "Item creation date/time. E.g., abbreviated day of week (ddd).",
    },
    helpTail: {
      rand20:
        "X5 = 5 hex chars (20-bit). D6 = 6 digits (with leading zeros). Optional trailing '_' adds underscore.",
      seq: "Use D + digits for left-padded decimal (e.g., D4). Plain 'D' for no padding.",
      date: "Common tokens: yyyy, yy, MM, dd, ddd.",
      fixed: "Free text; emoji allowed.",
    },
  },
};

const uid = () => Math.random().toString(36).slice(2, 9);

function normalizeInitial(val) {
  if (!val) return { enabled: true, elements: [] };
  const elements = (val.elements || []).map((el) => {
    const id = el.id || uid();
    switch (el.type) {
      case "text":   return { id, type: "fixed", value: el.value ?? "" };        // legacy
      case "rand32": return { id, type: "rand20", fmt: "X5_" };                  // legacy
      case "fixed":  return { id, type: "fixed", value: el.value ?? "" };
      case "rand20": return { id, type: "rand20", fmt: el.fmt ?? "X5_" };
      case "seq":    return { id, type: "seq",   fmt: el.fmt ?? (el.pad ? `D${el.pad}` : "D") };
      case "date":   return { id, type: "date",  fmt: el.fmt ?? el.format ?? "yyyy" };
      default:       return { id, ...el };
    }
  });
  return { enabled: !!val.enabled, elements };
}

/* ---------- preview helpers (stable) ---------- */

// Форматируем 20-битное число согласно fmt, не генеря новый рандом
function formatRand20(base20, fmt = "X5_") {
  const suffix = fmt.endsWith("_") ? "_" : "";
  if (/^X5_?$/i.test(fmt)) {
    return (base20 >>> 0).toString(16).toUpperCase().padStart(5, "0") + suffix;
  }
  const m = /^D(\d+)_?$/i.exec(fmt);
  if (m) {
    const len = Number(m[1] || 6);
    return String(base20 >>> 0).padStart(len, "0").slice(0, len) + suffix;
  }
  return (base20 >>> 0).toString(16).toUpperCase().padStart(5, "0") + suffix;
}

function datePreviewAt(d, fmt = "yyyy") {
  if (fmt == null) return "";
  const s = String(fmt);
  if (!/[yMdHhms]/i.test(s)) return s; // нет токенов — вернуть как есть

  const map = {
    yyyy: d.getFullYear().toString(),
    yy: d.getFullYear().toString().slice(-2),
    MM: String(d.getMonth() + 1).padStart(2, "0"),
    M: String(d.getMonth() + 1),
    dd: String(d.getDate()).padStart(2, "0"),
    d: String(d.getDate()),
    ddd: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
  };
  let out = s;
  for (const [k, v] of Object.entries(map)) out = out.replaceAll(k, v);
  return out;
}

function seqPreview(fmt = "D3") {
  const m = /^D(\d+)?$/.exec(fmt);
  if (!m) return "1";
  const pad = Number(m[1] || 0);
  return pad > 0 ? String(13).padStart(pad, "0") : "13";
}

// Превью учитывает draft-ввод, кэш rand20 по id и фиксированную дату
function renderPreviewStable(elements, drafts, randCacheMap, sampleDate) {
  const parts = [];
  for (const el of elements || []) {
    const draft = drafts.get(el.id);
    switch (el.type) {
      case "fixed": {
        parts.push((draft ?? el.value) ?? "");
        randCacheMap.delete(el.id);
        break;
      }
      case "rand20": {
        if (!randCacheMap.has(el.id)) {
          const n = crypto.getRandomValues(new Uint32Array(1))[0] & 0xFFFFF;
          randCacheMap.set(el.id, n);
        }
        const base = randCacheMap.get(el.id);
        const fmt  = (draft ?? el.fmt) ?? "X5_";
        parts.push(formatRand20(base, fmt));
        break;
      }
      case "seq": {
        randCacheMap.delete(el.id);
        const fmt = (draft ?? el.fmt) ?? "D3";
        parts.push(seqPreview(fmt));
        break;
      }
      case "date": {
        randCacheMap.delete(el.id);
        const fmt = (draft ?? el.fmt) ?? "yyyy";
        parts.push(datePreviewAt(sampleDate, fmt));
        break;
      }
      default: {
        randCacheMap.delete(el.id);
        parts.push("");
      }
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
  onDraftChange,     // сообщает текущий ввод наверх
  i18n,              // перевод
}) {
  const [showHelp, setShowHelp] = useState(false);

  // локальный буфер ввода
  const toStr = () => (el.type === "fixed" ? (el.value ?? "") : (el.fmt ?? ""));
  const [text, setText] = useState(toStr());
  const keyRef = useRef(`${el.id}|${el.type}`);

  // синхронизация только при смене структуры
  useEffect(() => {
    const nextKey = `${el.id}|${el.type}`;
    if (nextKey !== keyRef.current) {
      keyRef.current = nextKey;
      const next = toStr();
      setText(next);
      onDraftChange?.(el.id, next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el.id, el.type]);

  function commit(v) {
    setText(v);
    onDraftChange?.(el.id, v); // мгновенно влияет на Example
    if (el.type === "fixed") onChange({ ...el, value: v });
    else onChange({ ...el, fmt: v });
  }

  return (
    <div
      className="rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm p-3"
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2">
        {/* drag handle — DnD только на кнопке */}
        <button
          type="button"
          className="cursor-grab text-zinc-500 px-2"
          title={i18n.titles.drag}
          draggable
          onDragStart={onDragStart}
        >
          ↕
        </button>

        {/* type select */}
        <select
          className="rounded-xl border px-3 py-2 min-w-[180px]"
          value={el.type}
          onChange={(e) => {
            const t = e.target.value;
            if (t === "fixed") { onChange({ id: el.id, type: t, value: "" }); commit(""); }
            if (t === "rand20"){ onChange({ id: el.id, type: t, fmt: "X5_" }); commit("X5_"); }
            if (t === "seq")   { onChange({ id: el.id, type: t, fmt: "D3"  }); commit("D3"); }
            if (t === "date")  { onChange({ id: el.id, type: t, fmt: "yyyy"}); commit("yyyy"); }
          }}
        >
          {["fixed", "rand20", "seq", "date"].map((v) => (
            <option key={v} value={v}>{i18n.typeLabels[v]}</option>
          ))}
        </select>

        {/* value / fmt input */}
        <input
          className="flex-1 rounded-xl border px-3 py-2"
          placeholder={
            el.type === "fixed" ? i18n.placeholders.fixed :
            el.type === "rand20" ? i18n.placeholders.rand20 :
            el.type === "seq" ? i18n.placeholders.seq : i18n.placeholders.date
          }
          value={text}
          onChange={(e) => commit(e.target.value)}
        />

        {/* emoji quick insert for Fixed */}
        <button
          type="button"
          className="rounded-xl border px-2 py-2"
          title={i18n.titles.insertEmoji}
          onClick={() => el.type === "fixed" && commit((text || "") + "📚")}
        >
          😊
        </button>

        {/* help */}
        <button
          type="button"
          className="rounded-xl border px-2 py-2"
          title={i18n.titles.help}
          onClick={() => setShowHelp((s) => !s)}
        >
          ?
        </button>

        {/* remove */}
        <button
          type="button"
          className="text-red-600 px-2"
          onClick={onRemove}
          title={i18n.titles.delete}
        >
          ✕
        </button>
      </div>

      {/* description/help */}
      <div className="mt-2 text-sm text-zinc-500">
        {i18n.descr[el.type]}
        {showHelp && (
          <span className="ml-2 italic opacity-80">
            {el.type === "rand20"
              ? i18n.helpTail.rand20
              : el.type === "seq"
              ? i18n.helpTail.seq
              : el.type === "date"
              ? i18n.helpTail.date
              : i18n.helpTail.fixed}
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
  lang: langProp,            // опционально можно прокинуть сверху
}) {
  const lang = (langProp || localStorage.getItem("lang") || "ru") in I18N
    ? (langProp || localStorage.getItem("lang") || "ru")
    : "ru";
  const i18n = I18N[lang];

  const [cfg, setCfg] = useState(() => normalizeInitial(value));
  const [dragIdx, setDragIdx] = useState(null);
  const [savingState, setSavingState] = useState("idle"); // 'idle' | 'saving' | 'saved'
  const saveTimer = useRef(null);
  const isComposingRef = useRef(false);

  // стабильные источники для превью
  const randCacheRef = useRef(new Map());     // id -> base20
  const sampleDateRef = useRef(new Date());   // фиксированная дата для превью
  const draftsRef = useRef(new Map());        // id -> current input text

  // sync external value (строго по реальному отличию)
  useEffect(() => {
    setCfg((prev) => {
      const ext = JSON.stringify(normalizeInitial(value) || {});
      const cur = JSON.stringify(prev || {});
      return ext === cur ? prev : normalizeInitial(value);
    });
  }, [value]);

  // IME guard
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

  // прокидываем изменения наружу + автосейв (8s)
  useEffect(() => {
    onChange?.(cfg);

    if (!onSave) return;
    clearTimeout(saveTimer.current);
    if (isComposingRef.current) return;

    saveTimer.current = setTimeout(async () => {
      try {
        setSavingState("saving");
        await onSave(cfg);
        setSavingState("saved");
        setTimeout(() => setSavingState("idle"), 1200);
      } catch {
        setSavingState("idle");
      }
    }, 8000);
    return () => clearTimeout(saveTimer.current);
  }, [cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateAt(i, patch) {
    const next = [...cfg.elements];
    next[i] = patch;
    setCfg({ ...cfg, elements: next });
  }
  function removeAt(i) {
    const removed = cfg.elements[i];
    setCfg({ ...cfg, elements: cfg.elements.filter((_, idx) => idx !== i) });
    if (removed?.id) {
      randCacheRef.current.delete(removed.id);
      draftsRef.current.delete(removed.id);
    }
  }
  function addElement() {
    const id = uid();
    setCfg({
      ...cfg,
      elements: [...cfg.elements, { id, type: "fixed", value: "" }],
    });
    draftsRef.current.set(id, "");
  }

  const preview = useMemo(
    () => renderPreviewStable(
      cfg.elements,
      draftsRef.current,
      randCacheRef.current,
      sampleDateRef.current
    ),
    [cfg.elements]
  );

  return (
    <div className="space-y-5">
      {/* Header with saved state */}
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">{i18n.title}</div>
        {savingState === "saved" && (
          <span className="text-xs rounded-full bg-green-100 text-green-700 px-3 py-1">
            {i18n.savedBadge}
          </span>
        )}
        {savingState === "saving" && (
          <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-3 py-1">
            {i18n.savingBadge}
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-600">
        {i18n.intro}
      </p>

      <div className="text-sm">
        <span className="opacity-60 mr-2">{i18n.example}</span>
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
            onDraftChange={(id, v) => {
              if (v === undefined) draftsRef.current.delete(id);
              else draftsRef.current.set(id, v);
            }}
            i18n={i18n}
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
          {i18n.addElement}
        </button>
      </div>
    </div>
  );
}
