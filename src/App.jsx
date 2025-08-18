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
import LoginPage from './pages/LoginPage';

function ProtectedRoute({ isAuthed, children }) {
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser]   = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [lang, setLang]   = useState(localStorage.getItem('lang') || 'ru');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Забираем токен из hash после OAuth: #/oauth?token=...
  useEffect(() => {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/oauth')) {
      const q = new URLSearchParams(hash.split('?')[1] || '');
      const token = q.get('token');
      if (token) {
        setToken(token);
        // аккуратный replace state (без history.push)
        window.history.replaceState(null, '', '/');
        navigate('/', { replace: true });
      }
    }
  }, [navigate]);

  // Тема
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Язык
  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  // Проверяем текущего пользователя по JWT
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Загрузка...
      </div>
    );
  }

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
          <Route
            path="/"
            element={
              <HomePage
                user={user}
                lang={lang}
                t={t}
                onLoggedIn={(u) => {
                  setUser(u);
                  navigate('/', { replace: true });
                }}
              />
            }
          />

          {/* новая страница логина */}
          <Route
            path="/login"
            element={
              <LoginPage
                user={user}
                lang={lang}
                onLoggedIn={(u) => {
                  setUser(u);
                  navigate('/', { replace: true });
                }}
              />
            }
          />

          {/* список */}
          <Route path="/inventories" element={<AllInventories />} />

          {/* страница инвентаризации */}
          <Route path="/inventories/:id" element={<InventoryDetails user={user} lang={lang} />} />

          {/* отдельная страница редактирования */}
          <Route
            path="/inventories/:id/edit"
            element={
              <ProtectedRoute isAuthed={!!user}>
                <InventoryEdit user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute isAuthed={!!user}>
                <ProfilePage user={user} />
              </ProtectedRoute>
            }
          />

          {/* страница администратора */}
          <Route
            path="/admin"
            element={
              <RequireAdmin user={user}>
                <AdminPanel user={user} />
              </RequireAdmin>
            }
          />

          {/* фолбэк */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
