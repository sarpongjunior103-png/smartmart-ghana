// @ts-nocheck
'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/constants';

const REFUND_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
};

export function RefundsTab() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{ refundId: string; orderNumber: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/refunds', { headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (res.ok) setRefunds(data.refunds ?? []);
    } catch {
      toast.error('Failed to load refund requests');
    }
    setLoading(false);
  };

  useEffect(() => { fetchRefunds(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/refunds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refund_id: id, action: 'approve' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve refund');
      toast.success('Refund approved — order status updated & customer notified');
      fetchRefunds();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve refund');
    }
    setActionLoading(null);
  };

  const handleComplete = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/refunds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refund_id: id, action: 'complete' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete refund');
      toast.success('Refund completed — customer notified');
      fetchRefunds();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete refund');
    }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectionModal || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(rejectionModal.refundId);
    try {
      const res = await fetch('/api/refunds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refund_id: rejectionModal.refundId, action: 'reject', rejection_reason: rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject refund');
      toast.success('Refund rejected — customer notified');
      setRejectionModal(null);
      setRejectionReason('');
      fetchRefunds();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject refund');
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (refunds.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium">No refund requests</p>
          <p className="text-sm text-muted-foreground mt-1">Refund and cancellation requests will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {refunds.map((r) => {
          const statusInfo = REFUND_STATUS_LABELS[r.status] ?? REFUND_STATUS_LABELS.pending;
          return (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-sm">
                        {r.orders?.order_number ?? 'Unknown Order'}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${r.type === 'cancellation' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                        {r.type === 'cancellation' ? 'Cancellation' : 'Refund'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Reason:</span> {r.reason}
                    </p>
                    <p className="text-sm font-medium">
                      Amount: {formatPrice(Number(r.amount))}
                    </p>
                    {r.admin_notes && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Admin notes:</span> {r.admin_notes}
                      </p>
                    )}
                    {r.rejection_reason && (
                      <p className="text-sm text-red-600">
                        <span className="font-medium">Rejection reason:</span> {r.rejection_reason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Requested {new Date(r.created_at).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(r.id)} disabled={actionLoading === r.id}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRejectionModal({ refundId: r.id, orderNumber: r.orders?.order_number ?? '' })} disabled={actionLoading === r.id}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                  {r.status === 'approved' && (
                    <div className="flex shrink-0">
                      <Button size="sm" onClick={() => handleComplete(r.id)} disabled={actionLoading === r.id}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Completed
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rejection Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-lg">Reject Refund Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Provide a reason for rejecting the refund request for order <strong>{rejectionModal.orderNumber}</strong>. This will be emailed to the customer.
              </p>
              <div className="space-y-2">
                <Label htmlFor="refund_rejection_reason">Reason for Rejection</Label>
                <Textarea
                  id="refund_rejection_reason"
                  rows={4}
                  placeholder="e.g. Order has already been delivered and is non-refundable..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setRejectionModal(null); setRejectionReason(''); }}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={actionLoading === rejectionModal.refundId || !rejectionReason.trim()}>
                  {actionLoading === rejectionModal.refundId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reject & Notify
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
