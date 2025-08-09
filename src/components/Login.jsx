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
    <section id="login" className="card">
      <h2 className="text-xl font-semibold mb-4">Вход</h2>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block mb-1 text-sm text-gray-600 dark:text-gray-300">Email</label>
          <input className="input" type="email" autoComplete="email" required
                 value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="block mb-1 text-sm text-gray-600 dark:text-gray-300">Пароль</label>
          <input className="input" type="password" autoComplete="current-password" required
                 value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="btn-primary w-full" disabled={pending}>
          {pending ? 'Входим…' : 'Войти'}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Для первого входа используйте аккаунт администратора из .env на бэкенде
        </p>
      </form>
    </section>
  );
}
