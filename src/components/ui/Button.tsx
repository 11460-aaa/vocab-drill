import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium transition duration-200 focus-visible:ring-4 focus-visible:ring-moss-500/20 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-moss-600 text-white shadow-[0_10px_24px_-12px_rgba(37,110,76,0.7)] hover:bg-moss-700',
  secondary:
    'border border-ink-900/15 bg-white/80 text-ink-800 shadow-sm hover:border-ink-900/25 hover:bg-white',
  ghost: 'text-ink-600 hover:bg-ink-900/[0.05] hover:text-ink-900',
  danger:
    'bg-coral-500 text-white shadow-[0_10px_24px_-12px_rgba(189,71,57,0.7)] hover:bg-coral-600',
  soft: 'bg-moss-50 text-moss-700 hover:bg-moss-100',
  dark: 'bg-ink-900 text-cream-50 shadow-[0_12px_28px_-14px_rgba(20,32,28,0.8)] hover:bg-ink-800',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    type = 'button',
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
