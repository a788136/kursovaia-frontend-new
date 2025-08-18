// src/components/inventories/SortHeader.jsx
import React from 'react';

export default function SortHeader({ active, dir, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 select-none ${className}`}
      title="Sort"
    >
      <span>{children}</span>
      <span className={`text-xs opacity-70 transition-transform ${active ? '' : 'opacity-30'}`}>
        {active ? (dir === 'asc' ? '▲' : '▼') : '◇'}
      </span>
    </button>
  );
}
