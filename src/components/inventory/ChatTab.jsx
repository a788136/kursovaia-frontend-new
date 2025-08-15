// src/components/inventory/ChatTab.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { io } from 'socket.io-client';
import { discussionService } from '../../services/discussionService';

function useSocket(inventoryId) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!inventoryId) return;

    // Берём VITE_SOCKET_URL или VITE_API_URL; убираем суффикс /api если есть
    let base = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    if (base.endsWith('/api')) base = base.slice(0, -4);
    if (!base) return;

    const s = io(base, {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: false,
    });

    const onConnect = () => {
      s.emit('join', { inventoryId });
    };

    s.on('connect', onConnect);
    setSocket(s);

    return () => {
      try { s.emit('leave', { inventoryId }); } catch {}
      s.off('connect', onConnect);
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

  // Множество уже добавленных сообщений (по id) для дедупликации
  const seenIdsRef = useRef(new Set());

  const L = useMemo(() => ({
    title: 'Обсуждение',
    hint: 'Сообщения в реальном времени. Поддерживается Markdown.',
    placeholder: 'Напишите сообщение…',
    send: 'Отправить',
    loginNeeded: 'Чтобы отправлять сообщения, войдите в аккаунт.',
    loadFailed: 'Не удалось загрузить сообщения',
    sendFailed: 'Не удалось отправить сообщение',
  }), []);

  // Универсальная функция добавления сообщений с защитой от дублей
  const addMessages = useCallback((arr) => {
    if (!Array.isArray(arr) || !arr.length) return;
    setItems((prev) => {
      const next = [...prev];
      for (const m of arr) {
        const id = m?.id != null ? String(m.id) : '';
        if (!id) continue; // у нас всегда есть id с бэка, но на всякий…
        if (!seenIdsRef.current.has(id)) {
          seenIdsRef.current.add(id);
          next.push(m);
        }
      }
      return next;
    });
    // автоскролл вниз
    setTimeout(() => listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  // 1) начальная загрузка
  useEffect(() => {
    let dead = false;
    (async () => {
      if (!invId) return;
      try {
        const { items: list } = await discussionService.list(invId, { limit: 200 });
        if (dead) return;
        // Инициализируем множество уже виденных id и состояние
        const ids = new Set((list || []).map((m) => (m?.id != null ? String(m.id) : '')));
        seenIdsRef.current = ids;
        setItems(list || []);
        setTimeout(() => listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }), 50);
      } catch (e) {
        if (!dead) setError(e?.message || L.loadFailed);
      }
    })();
    return () => { dead = true; };
  }, [invId, L.loadFailed]);

  // 2) realtime по сокету — приходящие сообщения кладём через addMessages (дедуп)
  useEffect(() => {
    if (!socket) return;
    const onNew = (msg) => addMessages([msg]);
    socket.on('discussion:new', onNew);
    return () => socket.off('discussion:new', onNew);
  }, [socket, addMessages]);

  // 3) fallback polling (если WS не работает)
  useEffect(() => {
    if (!invId) return;
    const id = setInterval(async () => {
      try {
        const last = items[items.length - 1];
        const { items: fresh } = await discussionService.list(invId, { after: last?.createdAt });
        addMessages(fresh || []);
      } catch {}
    }, 10000);
    return () => clearInterval(id);
  }, [invId, items, addMessages]);

  async function handleSend(e) {
    e?.preventDefault?.();
    if (!text.trim()) return;
    if (!user) { setError(L.loginNeeded); return; }
    setPending(true);
    setError('');
    try {
      const payload = await discussionService.create(invId, text);
      // Добавляем через общий путь с дедупликацией.
      addMessages([payload]);
      setText('');
    } catch (e) {
      setError(e?.message || L.sendFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="p-4 rounded-2xl border flex flex-col gap-4">
      <div>
        <div className="font-semibold text-lg mb-1">{L.title}</div>
        <div className="opacity-70 text-sm">{L.hint}</div>
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
          placeholder={L.placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="shrink-0 px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
        >
          {L.send}
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
