import React from 'react';

export default function ThemeToggle({ theme, setTheme }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button className="btn-ghost" title="Theme" onClick={() => setTheme(next)}>
      {theme === 'dark' ? '🌙' : '☀️'}
      <span className="ml-2 hidden sm:inline capitalize">{theme}</span>
    </button>
  );
}
