import { useGetSalonBookings, useGetUserProfile, useGetSalonServices, useMarkBookingComplete } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Booking #{booking.id.toString()}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Customer: {customer?.name || 'Loading...'}
            </p>
          </div>
          <Badge variant={booking.completed ? 'default' : 'secondary'}>
            {booking.completed ? 'Completed' : 'Pending'}
          </Badge>
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
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{customer?.phoneNumber}</span>
          </div>
        </div>
        {!booking.completed && (
          <Button 
            onClick={handleMarkComplete} 
            className="w-full"
            disabled={markComplete.isPending}
          >
            {markComplete.isPending ? 'Marking...' : 'Mark as Completed'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
