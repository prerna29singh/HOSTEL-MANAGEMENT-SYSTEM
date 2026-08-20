import { Building2, Loader2 } from 'lucide-react';

export function FullScreenLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-primary text-white flex items-center justify-center shadow-lg animate-pulse-soft">
          <Building2 className="w-7 h-7" />
        </div>
        <div className="text-left">
          <h1 className="text-xl font-display font-bold text-gray-900 dark:text-white">HostelHub</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">Loading your workspace...</p>
        </div>
      </div>
      <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card p-6 space-y-3">
      <div className="skeleton h-6 w-32 rounded" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="skeleton h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/2 rounded" />
            <div className="skeleton h-3 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
