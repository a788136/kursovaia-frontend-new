import React, { useEffect, useState } from 'react';
import { likesApi } from '../services/likes';

const I18N = {
  ru: { like: 'Нравится', liked: 'Вы поставили лайк' },
  en: { like: 'Like', liked: 'You liked this' },
};

export default function LikeButton({
  itemId,
  initialCount,
  initiallyLiked,
  disabled,
  lang = localStorage.getItem('lang') || 'ru',
  className = '',
}) {
  const t = I18N[lang] || I18N.ru;

  const [count, setCount] = useState(initialCount ?? 0);
  const [liked, setLiked] = useState(!!initiallyLiked);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(initialCount != null || initiallyLiked != null);

  useEffect(() => {
    let dead = false;
    if (loaded) return;
    (async () => {
      try {
        const data = await likesApi.get(itemId);
        if (!dead) {
          if (typeof data.count === 'number') setCount(data.count);
          if (typeof data.liked === 'boolean') setLiked(data.liked);
          setLoaded(true);
        }
      } catch {
        // молча — лайки не критичны
        if (!dead) setLoaded(true);
      }
    })();
    return () => { dead = true; };
  }, [itemId, loaded]);

  async function toggle() {
    if (disabled || loading) return;
    setLoading(true);

    const prevLiked = liked;
    const prevCount = count;

    // оптимистично
    const nextLiked = !prevLiked;
    setLiked(nextLiked);
    setCount(prev => prev + (nextLiked ? 1 : -1));

    try {
      const resp = nextLiked ? await likesApi.like(itemId) : await likesApi.unlike(itemId);
      if (typeof resp.count === 'number') setCount(resp.count);
      if (typeof resp.liked === 'boolean') setLiked(resp.liked);
    } catch (e) {
      // откат
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm ${liked ? 'border-pink-300 bg-pink-50 text-pink-700' : 'border-zinc-300 bg-white text-zinc-700'} disabled:opacity-50 ${className}`}
      title={liked ? t.liked : t.like}
      aria-pressed={liked}
    >
      {/* heart icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
