// src/components/Navbar.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import http from '../api/http';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import LangToggle from './LangToggle';
import { clearToken } from '../api/token';
import SupportTicketModal from './SupportTicketModal';

export default function Navbar({ user, setUser, theme, setTheme, lang = 'ru', setLang }) {
  const t = useMemo(
    () => ({
      ru: { brand: 'Курсовой', signIn: 'Войти', searchPh: 'Поиск…', help: 'Help', createTicket: 'Создать тикет поддержки' },
      en: { brand: 'Kursovoi', signIn: 'Sign in', searchPh: 'Search…', help: 'Help', createTicket: 'Create support ticket' },
    }),
    []
  );
  const L = t[lang] || t.ru;

  const navigate = useNavigate();
  const location = useLocation();

  // --- Search in navbar ---
  const [term, setTerm] = useState('');
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    if (location.pathname === '/search') {
      setTerm(sp.get('q') || '');
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const q = (term || '').trim();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  async function handleLogout() {
    try {
      await http.post('/auth/logout');
    } catch {}
    clearToken?.();
    setUser?.(null);
    navigate('/');
  }

  // --- Support Ticket modal state ---
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportTemplate, setSupportTemplate] = useState('');

  // Global event to open modal with template from page
  useEffect(() => {
    function handler(ev) {
      const tpl = ev?.detail?.template || '';
      setSupportTemplate(tpl);
      setSupportOpen(true);
    }
    window.addEventListener('open-support-ticket', handler);
    return () => window.removeEventListener('open-support-ticket', handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-lg font-semibold">{L.brand}</Link>
          </div>

          <form onSubmit={onSubmitSearch} className="hidden md:block w-full max-w-md">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring dark:bg-gray-900 dark:border-gray-800"
              placeholder={L.searchPh}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </form>

          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <LangToggle lang={lang} setLang={setLang} />

            {/* Help button always visible */}
            <button
              onClick={() => { setSupportTemplate(''); setSupportOpen(true); }}
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              title={L.createTicket}
            >
              ❓ {L.help}
            </button>

            {user ? (
              <UserMenu user={user} onLogout={handleLogout} lang={lang} />
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm transition bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              >
                {L.signIn}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Fixed bottom link visible on every page */}
      <button
        onClick={() => { setSupportTemplate(''); setSupportOpen(true); }}
        className="fixed bottom-4 right-4 z-40 rounded-full border bg-white/90 px-4 py-2 text-sm shadow hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900 dark:border-gray-800"
      >
        {L.createTicket}
      </button>

      {/* Modal */}
      <SupportTicketModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        user={user}
        template={supportTemplate}
        lang={lang}
      />
    </>
  );
}
