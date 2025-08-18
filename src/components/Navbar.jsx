import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import http from '../api/http';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import LangToggle from './LangToggle';
import { clearToken } from '../api/token';

export default function Navbar({ user, setUser, theme, setTheme, lang = 'ru', setLang }) {
  const t = useMemo(() => ({
    ru: { brand: 'Курсовой', signIn: 'Войти' },
    en: { brand: 'Kursovoi', signIn: 'Sign in' }
  }), []);
  const L = t[lang] || t.ru;

  const handleLogout = async () => {
    try { await http.post('/auth/logout'); } catch {}
    clearToken();
    setUser(null);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/70 backdrop-blur dark:bg-gray-950/70 dark:border-gray-800">
      <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white grid place-items-center font-bold">K</div>
          <span className="font-semibold">{L.brand}</span>
        </Link>

        <div className="flex items-center gap-2">
          <LangToggle lang={lang} setLang={setLang} />
          <ThemeToggle theme={theme} setTheme={setTheme} lang={lang} />

          {user ? (
            <UserMenu user={user} onLogout={handleLogout} lang={lang} />
          ) : (
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              {L.signIn}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
