import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', {
  variants: {
    variant: {
      default: 'bg-zinc-700 text-zinc-100',
      success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      danger: 'bg-red-500/20 text-red-300 border border-red-500/30',
      muted: 'bg-zinc-600/30 text-zinc-300 border border-zinc-600/50',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
