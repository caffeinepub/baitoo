import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useConfirmBooking, useCancelBooking, useGetUserProfile, useGetSalonServices } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, User, Scissors } from 'lucide-react';
import type { Booking } from '../../backend';

interface BookingNotificationCardProps {
  booking: Booking;
  onActionComplete?: () => void;
}

export default function BookingNotificationCard({ booking, onActionComplete }: BookingNotificationCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  
  const { data: customer } = useGetUserProfile(booking.customer);
  const { data: services } = useGetSalonServices(booking.salonId.toString());
  const confirmBooking = useConfirmBooking();
  const cancelBooking = useCancelBooking();

  const service = services?.find(s => s.id === booking.serviceId);

  const handleConfirm = async () => {
    try {
      await confirmBooking.mutateAsync(booking.id);
      toast.success('Booking confirmed successfully!');
      onActionComplete?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm booking');
    }
  };

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      await cancelBooking.mutateAsync({
        bookingId: booking.id,
        reason: cancellationReason.trim(),
      });
      toast.success('Booking cancelled');
      setShowCancelDialog(false);
      setCancellationReason('');
      onActionComplete?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel booking');
    }
  };

  return (
    <>
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            New Booking Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{customer?.name || 'Loading...'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              <span>{service?.name || 'Loading...'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{booking.timeSlot}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleConfirm}
              disabled={confirmBooking.isPending || cancelBooking.isPending}
              className="flex-1"
              size="sm"
            >
              {confirmBooking.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirm
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowCancelDialog(true)}
              disabled={confirmBooking.isPending || cancelBooking.isPending}
              variant="destructive"
              className="flex-1"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Cancellation Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancellationReason('');
              }}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelBooking.isPending || !cancellationReason.trim()}
            >
              {cancelBooking.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
