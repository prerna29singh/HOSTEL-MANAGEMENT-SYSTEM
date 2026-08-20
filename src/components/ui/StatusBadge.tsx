import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'primary' | 'accent' | 'neutral';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  primary: 'badge-primary',
  accent: 'badge bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  neutral: 'badge-neutral',
};

export default function StatusBadge({
  status,
  variant,
  className,
}: {
  status: string;
  variant?: BadgeVariant;
  className?: string;
}) {
  const normalized = status.toLowerCase().replace(/_/g, ' ');
  const display = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  const autoVariant: BadgeVariant = (() => {
    if (['paid', 'approved', 'resolved', 'completed', 'present', 'active', 'delivered', 'ready', 'checked_out', 'good', 'available'].includes(normalized)) {
      return 'success';
    }
    if (['pending', 'partial', 'assigned', 'in_progress', 'in wash', 'picked_up', 'booked', 'fair', 'reserved', 'cleaning', 'late'].includes(normalized)) {
      return 'warning';
    }
    if (['overdue', 'rejected', 'open', 'blacklisted', 'absent', 'suspended', 'damaged', 'critical', 'cancelled'].includes(normalized)) {
      return 'error';
    }
    if (['checked_in', 'occupied', 'maintenance', 'repairing', 'high'].includes(normalized)) {
      return 'primary';
    }
    return 'neutral';
  })();

  const finalVariant = variant ?? autoVariant;

  return (
    <span className={cn(VARIANT_CLASSES[finalVariant], className)}>
      {display}
    </span>
  );
}
