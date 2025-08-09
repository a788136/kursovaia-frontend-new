import React, { useState } from 'react';
import http from '../api/http';

export default function Login({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      const { data } = await http.post('/auth/login', { email, password });
      if (data?.authenticated) {
        onLoggedIn(data.user);
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Ошибка входа');
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="login" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <h2 className="text-xl font-semibold mb-4">Вход</h2>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block mb-1 text-sm text-gray-600 dark:text-gray-300">Email</label>
          <input
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm text-gray-600 dark:text-gray-300">Пароль</label>
          <input
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition bg-blue-600 text-white hover:bg-blue-700 shadow-sm w-full disabled:opacity-50"
          disabled={pending}
        >
          {pending ? 'Входим…' : 'Войти'}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Для первого входа используйте аккаунт администратора из .env на бэкенде
        </p>
      </form>

      <div className="mt-4">
          <div className="text-center text-xs text-gray-500 mb-2">или</div>
          <a
            href="/api/auth/google"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition bg-white border border-gray-300 hover:bg-gray-50 w-full dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            Continue with Google
          </a>
        </div>
    </section>
  );
}
