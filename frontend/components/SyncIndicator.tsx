'use client';

import { cn } from '@/lib/utils';

type SyncIndicatorProps = {
  lastSyncedAt: string | null;
  isSyncing: boolean;
};

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export function SyncIndicator({ lastSyncedAt, isSyncing }: SyncIndicatorProps) {
  if (isSyncing) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
        <span className="h-2 w-2 animate-spin rounded-full border border-accent border-t-transparent" />
        Syncing...
      </div>
    );
  }

  const stale = !lastSyncedAt || Date.now() - new Date(lastSyncedAt).getTime() > FIFTEEN_MINUTES;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
      <span className={cn('h-2 w-2 rounded-full', stale ? 'bg-amber-400' : 'bg-emerald-400')} />
      {stale ? 'Stale - click to sync' : 'Synced'}
    </div>
  );
}
