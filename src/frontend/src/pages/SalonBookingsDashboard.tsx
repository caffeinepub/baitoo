import { useGetSalonBookings, useGetUserProfile, useGetSalonServices, useMarkBookingComplete } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { BookingStatus } from '../backend';
import { toast } from 'sonner';

export default function SalonBookingsDashboard() {
  const { data: bookings, isLoading } = useGetSalonBookings();

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
      <h1 className="text-3xl font-bold mb-6">Salon Bookings</h1>

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
  const { data: customer } = useGetUserProfile(booking.customer);
  const { data: services } = useGetSalonServices(booking.salonId.toString());
  const markComplete = useMarkBookingComplete();
  
  const service = services?.find(s => s.id === booking.serviceId);

  const handleMarkComplete = async () => {
    try {
      await markComplete.mutateAsync(booking.id);
      toast.success('Booking marked as completed!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark booking as complete');
    }
  };

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
            <CardTitle className="text-lg">{customer?.name || 'Loading...'}</CardTitle>
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
            <span className="font-medium">{service?.name || 'Loading...'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time:</span>
            <span className="font-medium">{booking.timeSlot}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{customer?.phoneNumber || 'N/A'}</span>
          </div>
        </div>

        {booking.status === BookingStatus.cancelled && booking.cancellationReason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-medium text-red-800 mb-1">Cancellation Reason:</p>
            <p className="text-sm text-red-700">{booking.cancellationReason}</p>
          </div>
        )}

        {booking.status === BookingStatus.confirmed && !booking.completed && (
          <Button 
            onClick={handleMarkComplete} 
            disabled={markComplete.isPending}
            className="w-full"
          >
            {markComplete.isPending ? 'Marking Complete...' : 'Mark as Completed'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
