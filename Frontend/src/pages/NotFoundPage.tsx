import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <FileQuestion className="mx-auto h-16 w-16 text-gray-400" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          Page Not Found
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          The page you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
