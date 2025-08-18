// src/components/Login.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Login({ onLoggedIn, lang = 'ru' }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending]   = useState(false);
  const [error, setError]       = useState('');
  const [showPw, setShowPw]     = useState(false);
  const navigate = useNavigate();

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
      loginErrorFallback: 'Ошибка входа',
      show: 'Показать',
      hide: 'Скрыть',
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
      loginErrorFallback: 'Sign-in error',
      show: 'Show',
      hide: 'Hide',
    }
  }), []);
  const L = t[lang] || t.ru;

  const canSubmit = email.trim() !== '' && password.trim() !== '' && !pending;

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setPending(true);
    try {
      const res = await authService.loginPassword(email, password);
      if (res?.authenticated && res?.user) {
        onLoggedIn?.(res.user);
        setEmail(''); setPassword('');
        navigate('/', { replace: true });
      } else {
        setError(L.serverRespInvalid);
      }
    } catch (err) {
      const msg = err?.message || L.loginErrorFallback;
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/,'');
  const oauthRedirect = `${window.location.origin}/#/oauth`;
  const googleHref = `${base}/auth/google?redirect=${encodeURIComponent(oauthRedirect)}`;
  const githubHref = `${base}/auth/github?redirect=${encodeURIComponent(oauthRedirect)}`;

  return (
    <section
      id="login"
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800"
    >
      <h2 className="text-xl font-semibold mb-4">{L.title}</h2>

      <form onSubmit={submit} className="space-y-3" noValidate>
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
            aria-label={L.email}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-600 dark:text-gray-300">
            {L.password}
          </label>
          <div className="relative">
            <input
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-20 text-sm outline-none
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={L.passwordPh}
              aria-label={L.password}
            />
            <button
              type="button"
              onClick={() => setShowPw(s => !s)}
              className="absolute inset-y-0 right-2 my-1 px-2 rounded-md text-xs text-gray-600 hover:bg-gray-100
                         dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label={showPw ? L.hide : L.show}
              title={showPw ? L.hide : L.show}
            >
              {showPw ? L.hide : L.show}
            </button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition
                     bg-blue-600 text-white hover:bg-blue-700 shadow-sm w-full disabled:opacity-50"
          disabled={!canSubmit}
          type="submit"
        >
          {pending ? L.signingIn : L.signIn}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        <div className="text-center text-xs text-gray-500">{L.or}</div>

        <a
          href={googleHref}
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition
                     bg-white border border-gray-300 hover:bg-gray-50 w-full
                     dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          {L.google}
        </a>

        <a
          href={githubHref}
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
