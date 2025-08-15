// src/components/UserMenu.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserMenu({ user, onLogout, lang = 'ru' }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const t = {
    ru: { profile: 'Профиль', admin: 'Админка', logout: 'Выйти' },
    en: { profile: 'Profile', admin: 'Admin', logout: 'Log out' }
  };
  const L = t[lang] || t.ru;

  const isAdmin = !!(user?.isAdmin || user?.role === 'admin');

  return (
    <div className="relative">
      <button
        className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
        onClick={() => setOpen(v => !v)}
      >
        <img
          src={user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.email)}`}
          alt="avatar" className="h-8 w-8 rounded-full"
        />
        <span className="ml-2 hidden sm:inline">{user.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:bg-gray-900 dark:border-gray-800">
          <div className="px-3 py-2 text-sm">
            <div className="font-medium">{user.name}</div>
            <div className="text-gray-500">{user.email}</div>
          </div>

          <button
            className="cursor-pointer block w-full text-left rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => {
              setOpen(false);
              navigate('/profile');
            }}
          >
            {L.profile}
          </button>

          {isAdmin && (
            <button
              className="cursor-pointer mt-1 block w-full text-left rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                setOpen(false);
                navigate('/admin');
              }}
            >
              {L.admin}
            </button>
          )}

          <button
            onClick={onLogout}
            className="mt-1 w-full text-left rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            {L.logout}
          </button>
        </div>
      )}
    </div>
  );
}
