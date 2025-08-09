import React from 'react';

export default function LangToggle({ lang, setLang }) {
  const next = lang === 'ru' ? 'en' : 'ru';
  return (
    <button className="btn-ghost" title="Language" onClick={() => setLang(next)}>
      🌐 <span className="ml-2 hidden sm:inline uppercase">{lang}</span>
    </button>
  );
}
