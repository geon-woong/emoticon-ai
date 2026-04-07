import { cn } from '@/lib/utils/cn';

interface Props {
  value: number; // 0..100
  className?: string;
}

export function ProgressBar({ value, className }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-brand-divider',
        className
      )}
    >
      <div
        className="h-full rounded-full bg-brand-btn2 transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
