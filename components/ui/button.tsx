'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const merged = clsx(
      'inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-blue-500/10 transition',
      'hover:border-accent-neon/70 hover:bg-accent-neon/20',
      'focus-visible:ring-2 focus-visible:ring-accent-neon focus-visible:ring-offset-2 focus-visible:ring-offset-backdrop',
      variant === 'ghost' &&
        'border-transparent bg-white/5 hover:bg-white/10 hover:border-white/20',
      className,
    );

    return <button ref={ref} className={merged} {...props} />;
  },
);

Button.displayName = 'Button';
