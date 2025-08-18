// src/pages/LoginPage.jsx
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

export default function LoginPage({ lang: langProp = 'ru', onLoggedIn }) {
  const lang = (langProp || localStorage.getItem('lang') || 'ru')
    .toLowerCase()
    .startsWith('en')
    ? 'en'
    : 'ru';

  const L = useMemo(
    () =>
      ({
        ru: {
          title: 'Вход',
          email: 'Email',
          password: 'Пароль',
          signIn: 'Войти',
          or: 'или',
          withGoogle: 'Войти через Google',
          withGithub: 'Войти через GitHub',
          backHome: '← На главную',
          errors: {
            required: 'Введите email и пароль',
            failed: 'Не удалось войти',
          },
        },
        en: {
          title: 'Sign in',
          email: 'Email',
          password: 'Password',
          signIn: 'Sign in',
          or: 'or',
          withGoogle: 'Continue with Google',
          withGithub: 'Continue with GitHub',
          backHome: '← Back to home',
          errors: {
            required: 'Enter email and password',
            failed: 'Sign-in failed',
          },
        },
      }[lang]),
    [lang]
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e?.preventDefault?.();
    setError('');
    if (!email.trim() || !password) {
      setError(L.errors.required);
      return;
    }
    setPending(true);
    try {
      const me = await authService.loginPassword(email.trim(), password);
      // ожидаем объект вида { authenticated, user }
      if (me?.authenticated && typeof onLoggedIn === 'function') {
        onLoggedIn(me.user || null);
      }
    } catch (err) {
      setError(err?.message || L.errors.failed);
    } finally {
      setPending(false);
    }
  }

  function goOAuth(provider) {
    try {
      const url = authService.buildOAuthUrl(provider);
      window.location.href = url;
    } catch {
      // noop
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          {L.backHome}
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="mb-4 text-xl font-semibold">{L.title}</div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm opacity-80">{L.email}</label>
            <input
              type="email"
              className="w-full rounded-xl border px-3 py-2 text-sm dark:border-gray-800 dark:bg-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm opacity-80">{L.password}</label>
            <input
              type="password"
              className="w-full rounded-xl border px-3 py-2 text-sm dark:border-gray-800 dark:bg-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? '…' : L.signIn}
          </button>
        </form>

        <div className="my-4 text-center text-xs opacity-60">{L.or}</div>

        <div className="grid gap-2">
          <button
            onClick={() => goOAuth('google')}
            className="w-full rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
            type="button"
          >
            {L.withGoogle}
          </button>
          <button
            onClick={() => goOAuth('github')}
            className="w-full rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
            type="button"
          >
            {L.withGithub}
          </button>
        </div>
      </div>
    </div>
  );
}
