import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; up: boolean };
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'error';
  subtitle?: string;
}

const COLOR_MAP = {
  primary: {
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    icon: 'text-primary-600 dark:text-primary-400',
    ring: 'ring-primary-500/20',
  },
  accent: {
    bg: 'bg-accent-50 dark:bg-accent-900/20',
    icon: 'text-accent-600 dark:text-accent-400',
    ring: 'ring-accent-500/20',
  },
  success: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    icon: 'text-success-600 dark:text-success-400',
    ring: 'ring-success-500/20',
  },
  warning: {
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    icon: 'text-warning-600 dark:text-warning-400',
    ring: 'ring-warning-500/20',
  },
  error: {
    bg: 'bg-error-50 dark:bg-error-900/20',
    icon: 'text-error-600 dark:text-error-400',
    ring: 'ring-error-500/20',
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  subtitle,
}: StatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <div className="card p-5 hover:shadow-card-hover transition-all duration-200 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{title}</p>
          <p className="text-3xl font-display font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center ring-4', colors.bg, colors.ring)}>
          <Icon className={cn('w-6 h-6', colors.icon)} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 mt-4">
          {trend.up ? (
            <TrendingUp className="w-4 h-4 text-success-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-error-500" />
          )}
          <span
            className={cn(
              'text-xs font-semibold',
              trend.up ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400',
            )}
          >
            {trend.value}
          </span>
          <span className="text-xs text-gray-400 dark:text-slate-500">vs last month</span>
        </div>
      )}
    </div>
  );
}
