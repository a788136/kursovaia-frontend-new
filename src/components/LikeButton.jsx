// src/components/LikeButton.jsx
import React, { useEffect, useState } from 'react';
import { likeService } from '../services/likeService';

export default function LikeButton({
  itemId,
  initialCount = 0,
  initialLiked = false,
  disabled = false,
  onChange,          // (next: { count, liked }) => void
}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [pending, setPending] = useState(false);

  // ресет при смене элемента или входных значений
  useEffect(() => {
    setCount(initialCount);
    setLiked(initialLiked);
    setPending(false);
  }, [itemId, initialCount, initialLiked]);

  async function handleClick(e) {
    e.stopPropagation(); // не открывать модалку строки
    if (disabled || pending) return;

    const nextLiked = !liked;
    const prev = { count, liked };

    // оптимистично
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    setPending(true);

    try {
      if (nextLiked) await likeService.like(itemId, token);
      else await likeService.unlike(itemId, token);
      onChange?.({ count: prev.count + (nextLiked ? 1 : -1), liked: nextLiked });
    } catch (err) {
      // откат при ошибке
      setLiked(prev.liked);
      setCount(prev.count);
      console.error('Like toggle failed:', err?.message || err);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || pending}
      aria-pressed={liked}
      title={liked ? 'Unlike' : 'Like'}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 border
        ${liked ? 'border-pink-300 bg-pink-50 text-pink-600' : 'border-zinc-200 bg-white text-zinc-700'}
        disabled:opacity-50`}
    >
      <HeartIcon filled={liked} />
      <span className="min-w-[1.5rem] text-sm tabular-nums">{count}</span>
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
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  );
}
