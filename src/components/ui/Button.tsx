import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-btn2 text-brand-text hover:brightness-105 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm',
  secondary:
    'bg-brand-btn1 text-brand-text hover:brightness-105 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-brand-text hover:bg-brand-divider/40 disabled:opacity-50 disabled:cursor-not-allowed',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = 'primary', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-bold transition',
        variants[variant],
        className
      )}
      {...rest}
    />
  );
});
