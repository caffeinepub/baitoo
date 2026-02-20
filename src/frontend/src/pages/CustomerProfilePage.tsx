import { useState, useEffect } from 'react';
import { useGetCallerUserProfile, useUpdateUserProfile, useUploadProfilePhoto, useGetCustomerBookings, useGetSalon, useGetSalonServices } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import ImageUploadField from '../components/shared/ImageUploadField';
import { toast } from 'sonner';
import { ExternalBlob, BookingStatus } from '../backend';

export default function CustomerProfilePage() {
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: bookings } = useGetCustomerBookings();
  const updateUserProfile = useUpdateUserProfile();
  const uploadProfilePhoto = useUploadProfilePhoto();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setPhoneNumber(userProfile.phoneNumber);
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phoneNumber.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // Upload profile photo if selected
      if (profilePhoto) {
        const arrayBuffer = await profilePhoto.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(uint8Array);
        await uploadProfilePhoto.mutateAsync(blob);
      }

      // Update user profile
      await updateUserProfile.mutateAsync({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      toast.success('Profile updated successfully!');
      setProfilePhoto(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  if (profileLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const currentPhotoUrl = userProfile?.profilePhoto?.getDirectURL();

  return (
    <div className="container px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUploadField
              label="Profile Photo"
              currentImageUrl={currentPhotoUrl}
              onChange={setProfilePhoto}
            />

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={updateUserProfile.isPending || uploadProfilePhoto.isPending}
            >
              {(updateUserProfile.isPending || uploadProfilePhoto.isPending) ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
        </CardHeader>
        <CardContent>
          {!bookings || bookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <BookingHistoryItem key={booking.id.toString()} booking={booking} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BookingHistoryItem({ booking }: { booking: any }) {
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
    <div className="border rounded-lg p-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium">{salon?.name}</p>
          <p className="text-sm text-muted-foreground">{service?.name}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {getStatusBadge()}
          {booking.completed && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">Completed</Badge>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{booking.timeSlot}</p>
    </div>
  );
}
