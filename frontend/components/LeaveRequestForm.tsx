'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type LeaveRequestFormProps = {
  availableDays: number;
  onSubmit: (payload: { daysRequested: number; reason: string }) => Promise<void>;
};

export function LeaveRequestForm({ availableDays, onSubmit }: LeaveRequestFormProps) {
  const [daysRequested, setDaysRequested] = useState<string>('1');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        daysRequested: Number(daysRequested),
        reason,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Leave</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-zinc-300" htmlFor="daysRequested">
              Days Requested
            </label>
            <Input
              id="daysRequested"
              type="number"
              min={0.5}
              step={0.5}
              max={availableDays}
              value={daysRequested}
              onChange={(event) => setDaysRequested(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-300" htmlFor="reason">
              Reason
            </label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
