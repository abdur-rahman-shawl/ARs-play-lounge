import clsx from 'clsx';
import { HTMLAttributes } from 'react';

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'highlight';
};

export function GlassCard({ className, variant = 'default', ...props }: GlassCardProps) {
  return (
    <div
      className={clsx(
        'glass-panel relative overflow-hidden border-white/10 text-slate-100',
        variant === 'highlight' && 'border-accent-neon/40 shadow-glow',
        className,
      )}
      {...props}
    />
  );
}
