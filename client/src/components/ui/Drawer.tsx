import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'w-[370px] sm:w-[390px]',
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in pointer-events-auto"
        onClick={onClose}
      />

      {/* Floating Condensed Drawer with Edge Gaps & Rounded Corners */}
      <aside
        className={cn(
          'fixed top-3.5 bottom-3.5 right-3.5 sm:top-4 sm:bottom-4 sm:right-4 z-50 flex flex-col',
          'max-w-[calc(100vw-1.75rem)]',
          'bg-card border border-border/80 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto',
          'transition-all duration-200 animate-fade-in',
          width
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-secondary/30 shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            {title && (
              <h2 className="text-xs font-semibold text-foreground tracking-tight truncate">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[11px] text-foreground-secondary mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground-muted hover:text-foreground hover:bg-secondary transition-colors shrink-0 cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {children}
        </div>
      </aside>
    </div>
  );
};
