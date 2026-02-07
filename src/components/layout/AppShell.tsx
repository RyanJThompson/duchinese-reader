import { Link, Outlet } from 'react-router';

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center">
          <Link to="/" className="text-lg font-bold text-gray-900 no-underline">
            <span className="text-red-600">中</span>文 Reader
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
