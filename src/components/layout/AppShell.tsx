import { Link, Outlet } from 'react-router';
import { usePreferences } from '../../context/usePreferences';

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function AppShell() {
  const { theme, setTheme } = usePreferences();

  const btnClass = (active: boolean) =>
    `p-1.5 rounded cursor-pointer transition-colors ${
      active
        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center">
          <Link to="/" className="text-lg font-bold text-gray-900 dark:text-gray-100 no-underline">
            <span className="text-red-600">中</span>文 Reader
          </Link>
          <div className="ml-auto flex items-center gap-0.5 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
            <button onClick={() => setTheme('light')} className={btnClass(theme === 'light')} title="Light">
              <SunIcon />
            </button>
            <button onClick={() => setTheme('auto')} className={btnClass(theme === 'auto')} title="Auto">
              <MonitorIcon />
            </button>
            <button onClick={() => setTheme('dark')} className={btnClass(theme === 'dark')} title="Dark">
              <MoonIcon />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
