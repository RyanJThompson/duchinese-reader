import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-gray-500 mb-6">Page not found</p>
      <Link
        to="/"
        className="text-red-600 hover:text-red-700 text-sm font-medium"
      >
        &larr; Back to lessons
      </Link>
    </div>
  );
}
