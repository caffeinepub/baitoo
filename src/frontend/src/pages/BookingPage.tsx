import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetSalon, useGetSalonServices, useGetTimeSlots, useBookAppointment } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

export default function BookingPage() {
  const { salonId } = useParams({ from: '/salons/$salonId/book' });
  const navigate = useNavigate();
  const { data: salon } = useGetSalon(salonId);
  const { data: services } = useGetSalonServices(salonId);
  const { data: timeSlots } = useGetTimeSlots(salonId);
  const bookAppointment = useBookAppointment();

  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedServiceId || !selectedTimeSlot) {
      toast.error('Please select a service and time slot');
      return;
    }

    try {
      const bookingId = await bookAppointment.mutateAsync({
        salonId: Principal.fromText(salonId),
        serviceId: BigInt(selectedServiceId),
        timeSlot: selectedTimeSlot,
      });

      toast.success('Appointment booked successfully!');
      navigate({ to: '/bookings/$bookingId/confirmation', params: { bookingId: bookingId.toString() } });
    } catch (error: any) {
      toast.error(error.message || 'Failed to book appointment');
    }
  };

  if (!salon) {
    return (
      <div className="container px-4 py-8">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Book Appointment</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{salon.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{salon.address}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="service">Select Service</Label>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger id="service">
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {services?.map((service) => (
                    <SelectItem key={service.id.toString()} value={service.id.toString()}>
                      {service.name} - ₹{Number(service.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeSlot">Select Time Slot</Label>
              <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                <SelectTrigger id="timeSlot">
                  <SelectValue placeholder="Choose a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots?.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={bookAppointment.isPending || !selectedServiceId || !selectedTimeSlot}
            >
              {bookAppointment.isPending ? 'Booking...' : 'Confirm Booking'}
            </Button>

            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Please reach the salon at least 10 minutes before your booking time.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
