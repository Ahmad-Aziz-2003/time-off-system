'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LeaveRequest } from '@/types';

type ManagerTableProps = {
  requests: LeaveRequest[];
  managerId: number;
  onAction: (requestId: number, managerId: number, action: 'APPROVED' | 'REJECTED', note: string) => Promise<void>;
};

export function ManagerTable({ requests, managerId, onAction }: ManagerTableProps) {
  const initialNotes = useMemo(() => {
    return requests.reduce<Record<number, string>>((acc, request) => {
      acc[request.id] = '';
      return acc;
    }, {});
  }, [requests]);

  const [notes, setNotes] = useState<Record<number, string>>(initialNotes);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const updateNote = (requestId: number, value: string) => {
    setNotes((prev) => ({ ...prev, [requestId]: value }));
  };

  const handleAction = async (requestId: number, action: 'APPROVED' | 'REJECTED') => {
    setProcessingId(requestId);
    try {
      await onAction(requestId, managerId, action, notes[requestId] ?? '');
    } finally {
      setProcessingId(null);
    }
  };

  if (!requests.length) {
    return <p className="rounded-lg border border-border bg-card p-6 text-sm text-zinc-400">No pending requests</p>;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Submitted Date</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.employeeId}</TableCell>
              <TableCell>{request.daysRequested}</TableCell>
              <TableCell className="max-w-[220px] break-words">{request.reason || 'N/A'}</TableCell>
              <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Input
                  value={notes[request.id] ?? ''}
                  onChange={(e) => updateNote(request.id, e.target.value)}
                  placeholder="Optional note"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500"
                    disabled={processingId === request.id}
                    onClick={() => handleAction(request.id, 'APPROVED')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={processingId === request.id}
                    onClick={() => handleAction(request.id, 'REJECTED')}
                  >
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
