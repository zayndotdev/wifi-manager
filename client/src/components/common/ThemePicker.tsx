import * as React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/Popover';
import { Button } from '../ui/Button';
import { Palette, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ThemePicker: React.FC = () => {
  const { palette, setPalette, themes } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground-secondary hover:text-foreground">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme palette</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="px-2 py-1 mb-1 border-b border-border">
          <span className="text-xs font-semibold text-foreground">Theme Palette</span>
          <p className="text-[10px] text-foreground-muted">Instant live UI preview</p>
        </div>
        <div className="space-y-0.5">
          {themes.map((t) => {
            const isSelected = palette === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setPalette(t.id)}
                className={cn(
                  'flex items-center justify-between w-full px-2 py-1.5 rounded-md text-xs transition-colors text-left cursor-pointer',
                  isSelected
                    ? 'bg-secondary font-medium text-foreground'
                    : 'text-foreground-secondary hover:bg-secondary/60 hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: t.dotColor }}
                  />
                  <span>{t.name}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
