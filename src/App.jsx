// src/App.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import http from './api/http';
import { setToken, getToken, clearToken } from './api/token';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import AllInventories from './pages/AllInventories';
import InventoryDetails from './pages/InventoryDetails';
import InventoryEdit from './pages/InventoryEdit';
import RequireAdmin from './components/routing/RequireAdmin';
import AdminPanel from './pages/AdminPanel';
import ItemDetails from './pages/ItemDetails';
import SearchResults from './pages/SearchResults';

function ProtectedRoute({ isAuthed, children }) {
  if (!isAuthed) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [user, setUser]   = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [lang, setLang]   = useState(localStorage.getItem('lang') || 'ru');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // OAuth: #/oauth?token=...
  useEffect(() => {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/oauth')) {
      const q = new URLSearchParams(hash.split('?')[1] || '');
      const token = q.get('token');
      if (token) {
        setToken(token);
        window.history.replaceState(null, '', '/');
        navigate('/', { replace: true });
      }
    }
  }, [navigate]);

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
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const t = useMemo(() => ({
    ru: { welcome: 'Добро пожаловать!', needLogin: 'Пожалуйста, войдите в аккаунт.' },
    en: { welcome: 'Welcome!', needLogin: 'Please sign in.' }
  }), []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Загрузка...</div>;

  return (
    <div className="min-h-screen">
      <Navbar
        user={user}
        setUser={(u) => {
          if (!u) clearToken();
          setUser(u);
        }}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
      />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <Routes>
          <Route path="/" element={
            <HomePage
              user={user}
              lang={lang}
              t={t}
              onLoggedIn={(u) => {
                setUser(u);
                navigate('/', { replace: true });
              }}
            />
          } />

          {/* Поиск */}
          <Route path="/search" element={<SearchResults user={user} />} />

          {/* Список */}
          <Route path="/inventories" element={<AllInventories />} />

          {/* Страница инвентаризации (внутри файла реализованы вложенные табы + поддержка ?tab=) */}
          <Route path="/inventories/:id" element={<InventoryDetails user={user} lang={lang}/>} />

          {/* Отдельная страница редактирования */}
          <Route path="/inventories/:id/edit" element={
            <ProtectedRoute isAuthed={!!user}>
              <InventoryEdit user={user} />
            </ProtectedRoute>
          } />

          {/* Страница айтема */}
          <Route path="/items/:itemId" element={<ItemDetails user={user} />} />

          {/* Профиль и write-access список */}
          <Route path="/profile" element={
            <ProtectedRoute isAuthed={!!user}>
              <ProfilePage user={user} />
            </ProtectedRoute>
          } />
          <Route path="/profile/write-access" element={
            <ProtectedRoute isAuthed={!!user}>
              <AllInventories key="write" /> {/* можно переиспользовать AllInventories, если он читает query */}
            </ProtectedRoute>
          } />

          {/* Страница администратора */}
          <Route
            path="/admin"
            element={
              <RequireAdmin user={user}>
                <AdminPanel user={user} />
              </RequireAdmin>
            }
          />

          {/* Фолбэк */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
