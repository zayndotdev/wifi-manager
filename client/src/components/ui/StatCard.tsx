import * as React from 'react';
import { Card } from './Card';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  className,
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-4 transition-all hover:border-border-hover',
        onClick && 'cursor-pointer hover:border-primary/50 hover:shadow-subtle select-none',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground-secondary">{label}</span>
        {icon && <div className="text-foreground-muted">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
        {trend && (
          <span
            className={cn(
              'text-[11px] font-medium',
              trend.isPositive ? 'text-emerald-600' : 'text-foreground-muted'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtext && <p className="mt-1 text-[11px] text-foreground-muted truncate">{subtext}</p>}
    </Card>
  );
};
