import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors border select-none',
  {
    variants: {
      variant: {
        neutral:
          'bg-secondary/60 text-foreground-secondary border-border',
        primary:
          'bg-primary/10 text-primary border-primary/20',
        online:
          'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        paused:
          'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
        blocked:
          'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
        warning:
          'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        throttled:
          'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
        offline:
          'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  dot = false,
  children,
  ...props
}) => {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props}>
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-emerald-500': variant === 'online',
            'bg-slate-400 dark:bg-slate-500': variant === 'offline',
            'bg-rose-500': variant === 'paused' || variant === 'blocked',
            'bg-amber-500': variant === 'warning',
            'bg-orange-500': variant === 'throttled',
            'bg-primary': variant === 'primary',
            'bg-foreground-muted': variant === 'neutral' || !variant,
          })}
        />
      )}
      {children}
    </span>
  );
};
