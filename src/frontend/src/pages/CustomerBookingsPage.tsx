import { useState } from 'react';
import { useGetCustomerBookings, useGetSalon, useGetSalonServices, useSubmitReview } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Star, X } from 'lucide-react';
import { BookingStatus, ExternalBlob } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import ImageUploadField from '../components/shared/ImageUploadField';

export default function CustomerBookingsPage() {
  const { data: bookings, isLoading } = useGetCustomerBookings();

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

      {!bookings || bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No bookings yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard key={booking.id.toString()} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking }: { booking: any }) {
  const { data: salon } = useGetSalon(booking.salonId.toString());
  const { data: services } = useGetSalonServices(booking.salonId.toString());
  const service = services?.find(s => s.id === booking.serviceId);

  const getStatusBadge = () => {
    switch (booking.status) {
      case BookingStatus.pending:
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
      case BookingStatus.confirmed:
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>;
      case BookingStatus.cancelled:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{salon?.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Booking #{booking.id.toString()}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            {booking.completed && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">Completed</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service:</span>
            <span className="font-medium">{service?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time:</span>
            <span className="font-medium">{booking.timeSlot}</span>
          </div>
        </div>

        {booking.status === BookingStatus.cancelled && booking.cancellationReason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-medium text-red-800 mb-1">Cancellation Reason:</p>
            <p className="text-sm text-red-700">{booking.cancellationReason}</p>
          </div>
        )}

        {booking.completed && booking.status !== BookingStatus.cancelled && (
          <ReviewDialog salonId={booking.salonId} salonName={salon?.name || ''} />
        )}
      </CardContent>
    </Card>
  );
}

function ReviewDialog({ salonId, salonName }: { salonId: Principal; salonName: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const submitReview = useSubmitReview();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      let photoBlob: ExternalBlob | null = null;
      
      if (photo) {
        const arrayBuffer = await photo.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        photoBlob = ExternalBlob.fromBytes(uint8Array);
      }

      await submitReview.mutateAsync({
        salonId,
        rating: BigInt(rating),
        comment: comment.trim(),
        photo: photoBlob,
      });

      toast.success('Review submitted successfully!');
      setOpen(false);
      setRating(0);
      setComment('');
      setPhoto(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Leave a Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review {salonName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Review</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <ImageUploadField
            label="Add Photo (Optional)"
            onChange={setPhoto}
          />

          <Button
            onClick={handleSubmit}
            disabled={submitReview.isPending || rating === 0}
            className="w-full"
          >
            {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
