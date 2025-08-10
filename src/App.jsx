import React, { useEffect, useMemo, useState } from 'react';
import http from './api/http';
import { setToken, getToken, clearToken } from './api/token';
import Navbar from './components/Navbar';
import Login from './components/Login';

export default function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'ru');
  const [loading, setLoading] = useState(true);

  // Считываем токен из hash после Google OAuth: #/oauth?token=...
  useEffect(() => {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/oauth')) {
      const q = new URLSearchParams(hash.split('?')[1] || '');
      const token = q.get('token');
      if (token) {
        setToken(token);
        // чистим hash, чтобы токен не светился в адресе
        history.replaceState(null, '', '/');
      }
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);

  useEffect(() => {
    (async () => {
      try {
        if (!getToken()) { setUser(null); return; }
        const { data } = await http.get('/auth/me');
        if (data.authenticated) {
          setUser(data.user);
          if (data.user.theme) setTheme(data.user.theme);
          if (data.user.lang) setLang(data.user.lang);
        } else {
          setUser(null);
        }
      } catch { setUser(null); }
      finally { setLoading(false); }
    })();
  }, []);

  const t = useMemo(() => ({
    ru: { welcome: 'Добро пожаловать!', needLogin: 'Пожалуйста, войдите в аккаунт.' },
    en: { welcome: 'Welcome!', needLogin: 'Please sign in.' }
  }), []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Загрузка...</div>;

  return (
    <div className="min-h-screen">
      <Navbar user={user} setUser={(u) => {
        if (!u) clearToken();
        setUser(u);
      }} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        {!user ? (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
              <h1 className="text-2xl font-semibold mb-2">{t[lang].welcome}</h1>
              <p className="text-gray-600 dark:text-gray-400">{t[lang].needLogin}</p>
            </div>
            <Login onLoggedIn={setUser} />
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <h1 className="text-2xl font-semibold mb-4">Привет, {user.name}!</h1>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div>Email: <span className="font-medium">{user.email}</span></div>
              <div>Язык: <span className="font-medium">{user.lang}</span></div>
              <div>Тема: <span className="font-medium">{user.theme}</span></div>
              <div>Создан: {new Date(user.createdAt).toLocaleString()}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
