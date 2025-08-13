import React, { useEffect, useState } from 'react';
import { likeService } from '../services/likeService';
import { getToken } from '../api/token';

export default function LikeButton({
  itemId,
  initialCount = 0,
  initialLiked = false,
  disabled = false,
  onChange,
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [pending, setPending] = useState(false);

  // Подтягиваем актуальные лайки при монтировании/смене itemId
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const data = await likeService.getLikes(itemId);
        if (dead) return;
        setCount(Number(data?.count || 0));
        setLiked(Boolean(data?.liked));
      } catch {
        // не критично для UI
      }
    })();
    return () => { dead = true; };
  }, [itemId]);

  const doToggle = async () => {
    if (disabled || pending) return;

    setPending(true);
    try {
      const data = liked
        ? await likeService.unlike(itemId)
        : await likeService.like(itemId);

      const next = { count: Number(data?.count || 0), liked: Boolean(data?.liked) };
      setCount(next.count);
      setLiked(next.liked);
      onChange?.(next);
    } catch (e) {
      // Варианты причин: токен протух, cookie не пришла из-за CORS, сессия неактивна
      alert('Не удалось изменить лайк. Проверьте вход или обновите страницу.');
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={doToggle}
      disabled={disabled || pending}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border
                  ${liked ? 'text-rose-600 border-rose-600' : 'text-gray-700 border-gray-300'}
                  disabled:opacity-50`}
      aria-pressed={liked}
      title={liked ? 'Убрать лайк' : 'Поставить лайк'}
    >
      <HeartIcon filled={liked} />
      <span>{count}</span>
    </button>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
