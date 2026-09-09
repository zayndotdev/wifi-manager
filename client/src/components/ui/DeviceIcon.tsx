import * as React from 'react';
import {
  Smartphone,
  Laptop,
  Tablet,
  Tv,
  Gamepad2,
  Cpu,
  Speaker,
  Printer,
  HelpCircle,
} from 'lucide-react';
import { DeviceCategory } from '../../types/device';
import { cn } from '../../lib/utils';

export interface DeviceIconProps {
  category: DeviceCategory;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({
  category,
  className,
  size = 'md',
}) => {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const containerSize =
    size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';

  const renderIcon = () => {
    switch (category) {
      case 'phone':
        return <Smartphone className={iconSize} />;
      case 'laptop':
        return <Laptop className={iconSize} />;
      case 'tablet':
        return <Tablet className={iconSize} />;
      case 'tv':
        return <Tv className={iconSize} />;
      case 'console':
        return <Gamepad2 className={iconSize} />;
      case 'iot':
        return <Cpu className={iconSize} />;
      case 'audio':
        return <Speaker className={iconSize} />;
      case 'printer':
        return <Printer className={iconSize} />;
      default:
        return <HelpCircle className={iconSize} />;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md bg-secondary/80 text-foreground-secondary border border-border shrink-0 select-none',
        containerSize,
        className
      )}
    >
      {renderIcon()}
    </div>
  );
};
