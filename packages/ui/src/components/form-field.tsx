import * as React from 'react';
import { cn } from '../lib/utils';
import { Label } from './label';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
  hint?: string;
}

/** Label + control + inline error, matching the Phase 1 form styling spec. */
export function FormField({ id, label, error, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-sm font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
