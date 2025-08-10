import React from 'react';
import Login from '../components/Login';

export default function HomePage({ user, lang, t, onLoggedIn }) {
  // Заглушка: если не авторизован — показываем привет + логин,
  // если авторизован — просто короткий приветственный текст.
  if (!user) {
    return (
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <h1 className="text-2xl font-semibold mb-2">{t[lang].welcome}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t[lang].needLogin}</p>
        </div>
        <Login onLoggedIn={onLoggedIn} lang={lang} />
      </div>
    );
  }

  // Авторизован: просто заглушка‑текст
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <h1 className="text-2xl font-semibold mb-2">
        {lang === 'ru' ? 'Главная' : 'Home'}
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        {lang === 'ru' ? 'Это главная страница (заглушка).' : 'This is the home page (placeholder).'}
      </p>
    </div>
  );
}
