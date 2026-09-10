import * as React from 'react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center gap-3 animate-fade-in">
      <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-xs font-medium text-foreground-muted">Loading view...</span>
    </div>
  );
};
