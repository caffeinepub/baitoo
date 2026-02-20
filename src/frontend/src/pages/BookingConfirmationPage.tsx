import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetBooking, useGetSalon, useGetSalonServices } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function BookingConfirmationPage() {
  const { bookingId } = useParams({ from: '/bookings/$bookingId/confirmation' });
  const navigate = useNavigate();
  const { data: booking, isLoading } = useGetBooking(bookingId);
  const { data: salon } = useGetSalon(booking?.salonId.toString());
  const { data: services } = useGetSalonServices(booking?.salonId.toString());

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Booking not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const service = services?.find(s => s.id === booking.serviceId);

  return (
    <div className="container px-4 py-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Booking ID</p>
              <p className="font-semibold">#{booking.id.toString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Salon</p>
              <p className="font-semibold">{salon?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="font-semibold">{service?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time Slot</p>
              <p className="font-semibold">{booking.timeSlot}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate({ to: '/my-bookings' })}
              className="w-full"
            >
              View My Bookings
            </Button>
            <Button 
              onClick={() => navigate({ to: '/salons' })}
              variant="outline"
              className="w-full"
            >
              Browse More Salons
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
