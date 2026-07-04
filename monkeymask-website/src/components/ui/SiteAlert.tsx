import * as React from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './Alert';

type SiteAlertVariant = 'default' | 'warning' | 'destructive';

export interface SiteAlertProps {
  title: string;
  children: React.ReactNode;
  variant?: SiteAlertVariant;
  icon?: string;
  className?: string;
}

/** Full-width site banner built on the shared Alert primitives. */
export function SiteAlert({
  title,
  children,
  variant = 'warning',
  icon = 'mdi:information-outline',
  className,
}: SiteAlertProps) {
  return (
    <Alert variant={variant} className={cn(className)}>
      <Icon icon={icon} aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className={variant === 'warning' ? 'text-accent-foreground' : undefined}>
        {children}
      </AlertDescription>
    </Alert>
  );
}

export default SiteAlert;
