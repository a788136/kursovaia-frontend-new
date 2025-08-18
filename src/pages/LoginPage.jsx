// src/pages/LoginPage.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { getToken } from '../api/token';

const DICT = {
  ru: {
    title: 'Вход в аккаунт',
    subtitle: 'Выберите способ входа: OAuth или по email/паролю (если доступно на бэкенде).',
    oauthTitle: 'OAuth вход',
    emailTitle: 'Вход по email/паролю',
    email: 'Email',
    password: 'Пароль',
    signIn: 'Войти',
    or: 'или',
    alreadyAuthed: 'Вы уже авторизованы.',
    backHome: 'На главную',
    providerGoogle: 'Войти через Google',
    providerGithub: 'Войти через GitHub',
    providerGeneric: 'Войти через OAuth',
    errorLogin: 'Не удалось войти',
  },
  en: {
    title: 'Sign in',
    subtitle: 'Choose a sign-in method: OAuth or email/password (if backend supports it).',
    oauthTitle: 'OAuth login',
    emailTitle: 'Email/Password login',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    or: 'or',
    alreadyAuthed: 'You are already signed in.',
    backHome: 'Back to Home',
    providerGoogle: 'Sign in with Google',
    providerGithub: 'Sign in with GitHub',
    providerGeneric: 'Sign in with OAuth',
    errorLogin: 'Failed to sign in',
  },
};

export default function LoginPage({ user, lang: langProp, onLoggedIn }) {
  const navigate = useNavigate();
  const lang = (langProp || localStorage.getItem('lang') || 'ru').toLowerCase().startsWith('en') ? 'en' : 'ru';
  const L = DICT[lang];

  // Если уже авторизованы — уводим со страницы логина
  const alreadyAuthed = !!user || !!getToken();
  if (alreadyAuthed) {
    return <Navigate to="/" replace />;
  }

  // Разрешаем конфигурировать список провайдеров через ENV,
  // напр. VITE_OAUTH_PROVIDERS="google,github"
  const providers = useMemo(() => {
    const envVal = (import.meta.env.VITE_OAUTH_PROVIDERS || '').trim();
    if (!envVal) return ['google', 'github']; // дефолт
    return envVal.split(',').map((s) => s.trim()).filter(Boolean);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  function handleOAuth(provider) {
    const url = authService.buildOAuthUrl(provider);
    window.location.href = url; // редирект на бэкенд
  }

  async function handlePasswordLogin(e) {
    e?.preventDefault?.();
    setError('');
    if (!email.trim() || !password) return;
    try {
      setPending(true);
      const me = await authService.loginPassword(email.trim(), password);
      if (me?.authenticated && me.user) {
        onLoggedIn?.(me.user);
        navigate('/', { replace: true });
      } else {
        setError(L.errorLogin);
      }
    } catch (err) {
      // Если /auth/login отсутствует на бэке — будет 404
      const msg = err?.response?.data?.message || err?.message || L.errorLogin;
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800 dark:bg-gray-950/40">
        <h1 className="text-2xl font-semibold">{L.title}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{L.subtitle}</p>

        {/* OAuth */}
        <div className="mt-6">
          <div className="text-sm font-medium opacity-80">{L.oauthTitle}</div>
          <div className="mt-3 grid gap-2">
            {providers.map((p) => {
              let label = L.providerGeneric;
              if (p === 'google') label = L.providerGoogle;
              if (p === 'github') label = L.providerGithub;
              return (
                <button
                  key={p}
                  onClick={() => handleOAuth(p)}
                  className="w-full rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-100"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* разделитель */}
        <div className="my-6 flex items-center">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          <div className="mx-3 text-xs uppercase opacity-50">{L.or}</div>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Email/Password */}
        <div>
          <div className="text-sm font-medium opacity-80">{L.emailTitle}</div>
          <form className="mt-3 grid gap-3" onSubmit={handlePasswordLogin}>
            <input
              type="email"
              placeholder={L.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm dark:border-gray-700 dark:bg-transparent"
              autoComplete="username"
            />
            <input
              type="password"
              placeholder={L.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm dark:border-gray-700 dark:bg-transparent"
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={pending || !email.trim() || !password}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {L.signIn}
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {L.backHome}
          </button>
        </div>
      </div>
    </div>
  );
}
