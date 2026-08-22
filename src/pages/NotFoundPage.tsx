import { Link } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Page not found</p>
      <Link
        to="/"
        className="text-red-600 hover:text-red-700 text-sm font-medium"
      >
        &larr; Back to lessons
      </Link>
    </div>
  );
}
