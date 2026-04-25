'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RequestStatus, type LeaveRequest } from '@/types';

type RequestCardProps = {
  request: LeaveRequest;
  onCancel: (requestId: number) => void;
};

const badgeByStatus: Record<RequestStatus, 'warning' | 'success' | 'danger' | 'muted'> = {
  [RequestStatus.PENDING]: 'warning',
  [RequestStatus.APPROVED]: 'success',
  [RequestStatus.REJECTED]: 'danger',
  [RequestStatus.CANCELLED]: 'muted',
};

export function RequestCard({ request, onCancel }: RequestCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-zinc-200">
              <span className="font-semibold">Days:</span> {request.daysRequested}
            </p>
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-zinc-300">Reason:</span> {request.reason || 'N/A'}
            </p>
            <p className="text-xs text-zinc-500">{new Date(request.createdAt).toLocaleString()}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant={badgeByStatus[request.status]}>{request.status}</Badge>
            {request.status === RequestStatus.PENDING && (
              <Button variant="destructive" size="sm" onClick={() => onCancel(request.id)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
