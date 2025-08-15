// src/components/inventory/ChatTab.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { io } from 'socket.io-client';
import { discussionService } from '../../services/discussionService';
import { getToken } from '../../api/token';

function useSocket(inventoryId) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!inventoryId) return;
    const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    if (!SOCKET_URL) { setSocket(null); return; }
    const s = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: false,
    });
    s.on('connect', () => {
      s.emit('join', { inventoryId });
    });
    setSocket(s);
    return () => {
      try { s.emit('leave', { inventoryId }); } catch {}
      s.disconnect();
    };
  }, [inventoryId]);

  return socket;
}

export default function ChatTab({ inventory, user }) {
  const invId = inventory?._id;
  const socket = useSocket(invId);
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const listRef = useRef(null);

  const L = useMemo(() => ({
    ru: {
      title: 'Обсуждение',
      hint: 'Сообщения реального времени (Markdown). Порядок строго по времени.',
      placeholder: 'Напишите сообщение… (Markdown поддерживается)',
      send: 'Отправить',
      loginNeeded: 'Для отправки войдите в аккаунт.',
      loadFailed: 'Не удалось загрузить сообщения',
      sendFailed: 'Не удалось отправить сообщение',
    },
    en: {
      title: 'Discussion',
      hint: 'Realtime posts (Markdown), strictly ordered by time.',
      placeholder: 'Write a message… (Markdown supported)',
      send: 'Send',
      loginNeeded: 'Sign in to post.',
      loadFailed: 'Failed to load messages',
      sendFailed: 'Failed to send message',
    }
  }), []);

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!invId) return;
      try {
        const res = await discussionService.list(invId);
        if (mounted) setItems(res.items || []);
        setTimeout(() => listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }), 50);
      } catch (e) {
        setError(e?.message || L.ru.loadFailed);
      }
    })();
    return () => { mounted = false; };
  }, [invId]);

  // Realtime updates
  useEffect(() => {
    if (!socket) return;
    const onNew = (msg) => {
      setItems(prev => [...prev, msg]);
      setTimeout(() => listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }), 50);
    };
    socket.on('discussion:new', onNew);
    return () => {
      socket.off('discussion:new', onNew);
    };
  }, [socket]);

  // Polling fallback every 10s (если WebSocket недоступен)
  useEffect(() => {
    if (!invId) return;
    const id = setInterval(async () => {
      try {
        const last = items[items.length - 1];
        const res = await discussionService.list(invId, { after: last?.createdAt });
        if (res.items?.length) setItems(prev => [...prev, ...res.items]);
      } catch {}
    }, 10000);
    return () => clearInterval(id);
  }, [invId, items]);

  async function handleSend(e) {
    e?.preventDefault?.();
    if (!text.trim()) return;
    if (!user) { setError(L.ru.loginNeeded); return; }
    setPending(true);
    setError('');
    try {
      const payload = await discussionService.create(invId, text, getToken());
      setItems(prev => [...prev, payload]);
      setText('');
      setTimeout(() => listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) {
      setError(e?.message || L.ru.sendFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="p-4 rounded-2xl border flex flex-col gap-4">
      <div>
        <div className="font-semibold text-lg mb-1">{L.ru.title}</div>
        <div className="opacity-70 text-sm">{L.ru.hint}</div>
      </div>

      <div ref={listRef} className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2">
        {items.map((m) => (
          <div key={m.id} className="flex gap-3">
            {m.author?.avatar ? (
              <img src={m.author.avatar} alt={m.author?.name || 'avatar'} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                {(m.author?.name || '?').slice(0,1).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">
                {m.author?.name || 'User'}
                <span className="opacity-60 ml-2 text-xs">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <div className="max-w-none text-sm leading-relaxed">
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {!items.length && <div className="opacity-60 text-sm">Сообщений пока нет.</div>}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <textarea
          className="flex-1 border rounded-xl p-3 min-h-[80px] outline-none focus:ring"
          placeholder={L.ru.placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="shrink-0 px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
          >
          {L.ru.send}
        </button>
      </form>

      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}

ChatTab.propTypes = {
  inventory: PropTypes.object.isRequired,
  user: PropTypes.object,
};
