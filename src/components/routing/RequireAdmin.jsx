// src/components/routing/RequireAdmin.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAdmin({ user, children }) {
  const location = useLocation();
  const isAdmin = !!(user?.isAdmin || user?.role === 'admin');

  if (!user) {
    // Если не залогинен — уводим на логин/профиль (или замените на вашу страницу логина)
    return <Navigate to="/profile" replace state={{ from: location }} />;
  }
  if (!isAdmin) {
    // Нет прав админа — показываем 403 (либо редиректите, если так удобнее)
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border p-6">
          <div className="text-xl font-semibold mb-2">403 — Доступ запрещён</div>
          <div className="opacity-70">Эта страница доступна только администраторам.</div>
        </div>
      </div>
    );
  }
  return children;
}

RequireAdmin.propTypes = {
  user: PropTypes.object,
  children: PropTypes.node.isRequired,
};
