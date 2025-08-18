// src/components/inventories/Toolbar.jsx
import React from 'react';

export default function Toolbar({
  title,
  q,
  setQ,
  creating,
  onCreateClick,
  t,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="text-2xl font-semibold">{title}</div>
      <div className="flex-1" />

      {/* search */}
      <div className="relative w-full sm:w-80">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full border rounded-xl px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:bg-transparent"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-50">⌕</span>
      </div>

      {/* create */}
      <button
        onClick={() => onCreateClick?.()}
        className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={creating}
        title={t('create')}
      >
        {creating ? t('creating') : t('create')}
      </button>
    </div>
  );
}
