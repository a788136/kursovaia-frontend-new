// src/pages/ProfilePage.jsx
import React from 'react';

export default function ProfilePage({ user }) {
  if (!user) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
        <h1 className="text-2xl font-semibold mb-2">Профиль</h1>
        <p className="text-gray-600 dark:text-gray-400">Нет данных пользователя.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <h1 className="text-2xl font-semibold mb-4">Привет, {user.name}!</h1>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <div>Email: <span className="font-medium">{user.email}</span></div>
        <div>Язык: <span className="font-medium">{user.lang}</span></div>
        <div>Тема: <span className="font-medium">{user.theme}</span></div>
        <div>Создан: {new Date(user.createdAt).toLocaleString()}</div>

        {/* Глобальные роли пользователя */}
        {Array.isArray(user.roles) && user.roles.length > 0 && (
          <div className="mt-4">
            <div className="mb-1 opacity-70">Роли</div>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((r) => (
                <span key={r} className="rounded-full border px-2 py-0.5 text-xs capitalize">{r}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
