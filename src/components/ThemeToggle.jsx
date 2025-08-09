export default function ThemeToggle({ theme, setTheme }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition
                 bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
      title="Theme"
      onClick={() => setTheme(next)}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
      <span className="ml-2 hidden sm:inline capitalize">{theme}</span>
    </button>
  );
}