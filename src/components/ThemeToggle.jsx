export default function ThemeToggle({ theme, setTheme, lang = 'ru' }) {
  const next = theme === 'dark' ? 'light' : 'dark';

  const t = {
    ru: { light: 'Светлая', dark: 'Тёмная', title: 'Тема' },
    en: { light: 'Light', dark: 'Dark', title: 'Theme' }
  };
  const L = t[lang] || t.ru;

  return (
    <button
      className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition
                 bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
      title={L.title}
      onClick={() => setTheme(next)}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
      <span className="ml-2 hidden sm:inline">{L[theme]}</span>
    </button>
  );
}
