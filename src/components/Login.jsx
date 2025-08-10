import React, { useState, useMemo } from 'react';
import http from '../api/http';
import { setToken } from '../api/token';

export default function Login({ onLoggedIn, lang = 'ru' }) {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError]     = useState('');

  // Тексты
  const t = useMemo(() => ({
    ru: {
      title: 'Вход',
      email: 'Email',
      password: 'Пароль',
      emailPh: 'you@example.com',
      passwordPh: '••••••••',
      signIn: 'Войти',
      signingIn: 'Входим…',
      or: 'или',
      google: 'Продолжить с Google',
      github: 'Продолжить с GitHub',
      serverRespInvalid: 'Неверный ответ сервера',
      loginErrorFallback: 'Ошибка входа'
    },
    en: {
      title: 'Sign in',
      email: 'Email',
      password: 'Password',
      emailPh: 'you@example.com',
      passwordPh: '••••••••',
      signIn: 'Sign in',
      signingIn: 'Signing in…',
      or: 'or',
      google: 'Continue with Google',
      github: 'Continue with GitHub',
      serverRespInvalid: 'Invalid server response',
      loginErrorFallback: 'Sign-in error'
    }
  }), []);

  const L = t[lang] || t.ru;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      const { data } = await http.post('/auth/login', { email, password });
      if (data?.accessToken && data?.user) {
        setToken(data.accessToken);
        onLoggedIn(data.user);
        setEmail('');
        setPassword('');
      } else {
        setError(L.serverRespInvalid);
      }
    } catch (err) {
      setError(err?.response?.data?.error || L.loginErrorFallback);
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      id="login"
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800"
    >
      <h2 className="text-xl font-semibold mb-4">{L.title}</h2>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block mb-1 text-sm text-gray-600 dark:text-gray-300">
            {L.email}
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={L.emailPh}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-600 dark:text-gray-300">
            {L.password}
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={L.passwordPh}
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition
                     bg-blue-600 text-white hover:bg-blue-700 shadow-sm w-full disabled:opacity-50"
          disabled={pending}
        >
          {pending ? L.signingIn : L.signIn}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        <div className="text-center text-xs text-gray-500">{L.or}</div>

        {/* Google OAuth (через Vercel proxy /api) */}
        <a
          href="/api/auth/google"
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition
                     bg-white border border-gray-300 hover:bg-gray-50 w-full
                     dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          {L.google}
        </a>

        {/* GitHub OAuth */}
        <a
          href="/api/auth/github"
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition
                     bg-white border border-gray-300 hover:bg-gray-50 w-full
                     dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          {L.github}
        </a>
      </div>
    </section>
  );
}
