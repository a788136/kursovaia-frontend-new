// src/components/inventories/InventoryGrid.jsx
import React from 'react';
import SortHeader from './SortHeader';
import { GRID_COLS, formatAuthor } from './listHelpers';

export default function InventoryGrid({
  rows,
  onRowClick,
  sortKey,
  sortDir,
  toggleSort,
  t,
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* header */}
      <div
        role="row"
        className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur dark:bg-gray-900/95 px-4 py-3 text-sm font-semibold"
        style={{ display: 'grid', gridTemplateColumns: GRID_COLS }}
      >
        <div role="columnheader" className="text-left">{t('image')}</div>

        <div role="columnheader" className="text-left">
          <SortHeader
            active={sortKey === 'name'}
            dir={sortDir}
            onClick={() => toggleSort('name')}
            className="text-left"
          >
            {t('name')}
          </SortHeader>
        </div>

        <div role="columnheader" className="text-left">{t('owner')}</div>

        <div role="columnheader" className="text-left hidden md:block">{t('description')}</div>

        <div role="columnheader" className="text-left">
          <SortHeader
            active={sortKey === 'updatedAt'}
            dir={sortDir}
            onClick={() => toggleSort('updatedAt')}
          >
            {t('updated')}
          </SortHeader>
        </div>
      </div>

      {/* rows */}
      <div role="rowgroup">
        {rows.map((row) => (
          <div
            key={row._id}
            role="row"
            onClick={() => onRowClick?.(row)}
            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer border-t border-gray-100 dark:border-gray-800"
            style={{ display: 'grid', gridTemplateColumns: GRID_COLS, alignItems: 'center' }}
            title={row.name || 'Inventory'}
          >
            {/* cover */}
            <div role="cell" className="py-1">
              {row.cover ? (
                <img
                  src={row.cover}
                  alt=""
                  className="h-10 w-10 object-cover rounded-md border"
                  loading="lazy"
                />
              ) : (
                <div className="h-10 w-10 rounded-md border flex items-center justify-center text-xs text-gray-400">
                  —
                </div>
              )}
            </div>

            {/* name */}
            <div role="cell" className="font-medium truncate pr-2">
              {row.name || '—'}
            </div>

            {/* owner */}
            <div role="cell" className="truncate pr-2">
              {formatAuthor(row)}
            </div>

            {/* description */}
            <div role="cell" className="text-gray-600 dark:text-gray-400 hidden md:block pr-4">
              {row.description
                ? (row.description.length > 140
                    ? row.description.slice(0, 140) + '…'
                    : row.description)
                : '—'}
            </div>

            {/* updated */}
            <div role="cell" className="whitespace-nowrap text-gray-700 dark:text-gray-300">
              {row.updatedAt
                ? new Date(row.updatedAt).toLocaleDateString()
                : (row.createdAt
                    ? new Date(row.createdAt).toLocaleDateString()
                    : '—')}
            </div>
          </div>
        ))}

        {!rows.length && (
          <div className="px-4 py-10 text-center text-gray-500">
            {t('empty')}
          </div>
        )}
      </div>
    </div>
  );
}
