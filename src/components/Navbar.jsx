// src/components/Navbar.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import http from '../api/http';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import LangToggle from './LangToggle';
import { clearToken } from '../api/token';

export default function Navbar({ user, setUser, theme, setTheme, lang = 'ru', setLang }) {
  const t = useMemo(
    () => ({
      ru: { brand: 'Курсовой', signIn: 'Войти', searchPh: 'Поиск…' },
      en: { brand: 'Kursovoi', signIn: 'Sign in', searchPh: 'Search…' },
    }),
    []
  );
  const L = t[lang] || t.ru;

  const navigate = useNavigate();
  const location = useLocation();

  // --- Search in navbar ---
  const [term, setTerm] = useState('');
  useEffect(() => {
    // Prefill when we are on /search
    const sp = new URLSearchParams(location.search);
    if (location.pathname === '/search') {
      setTerm(sp.get('q') || '');
    } else {
      // don't clobber when leaving search
      setTerm((v) => v);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleLogout = async () => {
    try { await http.post('/auth/logout'); } catch {}
    clearToken();
    setUser?.(null);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/70 backdrop-blur dark:bg-gray-950/70 dark:border-gray-800">
      <div className="mx-auto max-w-5xl px-4 h-16 flex items-center gap-3">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="h-8 w-8 rounded-xl bg-blue-600 text-white grid place-items-center font-bold">K</div>
          <div className="text-lg font-semibold">{L.brand}</div>
        </Link>

        {/* Search (desktop + mobile) */}
        <form onSubmit={onSubmitSearch} className="flex-1 min-w-0">
          <input
            aria-label="Search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={L.searchPh}
            className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
          />
        </form>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <LangToggle lang={lang} setLang={setLang} />
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} lang={lang} />
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl px-3 h-10 text-sm transition bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              {L.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
