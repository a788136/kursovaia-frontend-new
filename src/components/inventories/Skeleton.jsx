// src/components/inventories/Skeleton.jsx
import React from 'react';
import { GRID_COLS } from './listHelpers';

export default function Skeleton({ title = '...' }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="text-2xl font-semibold">{title}</div>
        <div className="flex-1" />
        <div className="h-10 w-full sm:w-80 bg-gray-100 dark:bg-gray-900 rounded-lg animate-pulse" />
        <div className="h-10 w-28 bg-gray-100 dark:bg-gray-900 rounded-lg animate-pulse" />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* header */}
        <div
          className="bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-medium"
          style={{ display: 'grid', gridTemplateColumns: GRID_COLS }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 w-24 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
          ))}
        </div>

        {/* rows */}
        {Array.from({ length: 6 }).map((_, r) => (
          <div
            key={r}
            className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 animate-pulse"
            style={{ display: 'grid', gridTemplateColumns: GRID_COLS }}
          >
            {Array.from({ length: 5 }).map((__, c) => (
              <div
                key={c}
                className={`h-4 ${c === 0 ? 'w-10' : 'w-32'} bg-gray-100 dark:bg-gray-900 rounded`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
