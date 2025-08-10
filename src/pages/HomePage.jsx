import React from 'react';
import Login from '../components/Login';
import AllInventories from './AllInventories';

export default function HomePage({ user, lang, t, onLoggedIn }) {
  // Неавторизован: приветствие + логин, а НИЖЕ — список инвентаризаций
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

        {/* Таблица инвентаризаций на главной */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4">
            {lang === 'ru' ? 'Все инвентаризации' : 'All inventories'}
          </h2>
          <AllInventories />
        </section>
      </div>
    );
  }

  // Авторизован: сразу показываем таблицу
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <h1 className="text-2xl font-semibold mb-4">
        {lang === 'ru' ? 'Инвентаризации' : 'Inventories'}
      </h1>
      <AllInventories />
    </section>
  );
}
