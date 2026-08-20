import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white mb-6">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-6xl font-display font-bold text-gray-900 dark:text-white mb-2">404</h1>
        <p className="text-lg text-gray-500 dark:text-slate-400 mb-6">This page doesn't exist.</p>
        <Link to="/app/dashboard" className="btn-primary inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
