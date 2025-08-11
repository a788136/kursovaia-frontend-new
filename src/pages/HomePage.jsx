// src/pages/HomePage.jsx
import React from 'react';
import Login from '../components/Login';
import AllInventories from './AllInventories';

export default function HomePage({ user, lang, t, onLoggedIn }) {
  const isRu = (lang || 'ru') === 'ru';

  // Неавторизован: приветствие + логин, ниже – список инвентаризаций
  if (!user) {
    return (
      <div className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <h1 className="text-2xl font-semibold mb-2">{t[lang].welcome}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t[lang].needLogin}</p>
          </div>
          <Login onLoggedIn={onLoggedIn} lang={lang} />
        </div>

        {/* Секция со списком инвентаризаций */}
        {/* <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4">
            {isRu ? 'Все инвентаризации' : 'All inventories'}
          </h2> */}
          {/* Передаём lang и t, чтобы работал i18n внутри AllInventories */}
          {/* <AllInventories lang={lang} t={t} />
        </section> */}
      </div>
    );
  }

  // Авторизован: сразу показываем список
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <h1 className="text-2xl font-semibold mb-4">
        {isRu ? 'Инвентаризации' : 'Inventories'}
      </h1>
      {/* Также пробрасываем lang и t */}
      <AllInventories lang={lang} t={t} />
    </section>
  );
}
