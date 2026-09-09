import * as React from 'react';
import { formatRssi } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from './Tooltip';

export interface RssiIndicatorProps {
  dbm: number;
  showDbmText?: boolean;
  className?: string;
}

export const RssiIndicator: React.FC<RssiIndicatorProps> = ({
  dbm,
  showDbmText = true,
  className,
}) => {
  const { label, color, bars } = formatRssi(dbm);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('inline-flex items-center gap-1.5 select-none cursor-default', className)}>
          <div className="flex items-end gap-[2px] h-3.5 w-4">
            <span
              className={cn(
                'w-0.5 rounded-xs transition-colors',
                bars >= 1 ? 'h-1 bg-current' : 'h-1 bg-border-default',
                color
              )}
            />
            <span
              className={cn(
                'w-0.5 rounded-xs transition-colors',
                bars >= 2 ? 'h-1.5 bg-current' : 'h-1.5 bg-border-default',
                color
              )}
            />
            <span
              className={cn(
                'w-0.5 rounded-xs transition-colors',
                bars >= 3 ? 'h-2.5 bg-current' : 'h-2.5 bg-border-default',
                color
              )}
            />
            <span
              className={cn(
                'w-0.5 rounded-xs transition-colors',
                bars >= 4 ? 'h-3.5 bg-current' : 'h-3.5 bg-border-default',
                color
              )}
            />
          </div>
          {showDbmText && (
            <span className="text-[11px] text-foreground-secondary tabular-nums font-mono">
              {dbm} dBm
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <span>Signal: {label} ({dbm} dBm)</span>
      </TooltipContent>
    </Tooltip>
  );
};
