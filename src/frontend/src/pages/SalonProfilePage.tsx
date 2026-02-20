import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetSalon, useCreateOrUpdateSalon, useGetCallerUserProfile, useUpdateUserProfile, useUploadProfilePhoto } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import ImageUploadField from '../components/shared/ImageUploadField';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';

export default function SalonProfilePage() {
  const { identity } = useInternetIdentity();
  const salonId = identity?.getPrincipal().toString();
  const { data: salon } = useGetSalon(salonId);
  const { data: userProfile } = useGetCallerUserProfile();
  const createOrUpdateSalon = useCreateOrUpdateSalon();
  const updateUserProfile = useUpdateUserProfile();
  const uploadProfilePhoto = useUploadProfilePhoto();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  useEffect(() => {
    if (salon) {
      setName(salon.name);
      setAddress(salon.address);
      setContactNumber(salon.contactNumber);
      setOpeningHours(salon.openingHours);
    }
  }, [salon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !address.trim() || !contactNumber.trim() || !openingHours.trim()) {
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

      // Update salon profile
      await createOrUpdateSalon.mutateAsync({
        name: name.trim(),
        address: address.trim(),
        contactNumber: contactNumber.trim(),
        openingHours: openingHours.trim(),
      });

      // Update user profile if needed
      if (userProfile) {
        await updateUserProfile.mutateAsync({
          name: userProfile.name,
          phoneNumber: userProfile.phoneNumber,
        });
      }

      toast.success('Salon profile saved successfully!');
      setProfilePhoto(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save salon profile');
    }
  };

  const currentPhotoUrl = userProfile?.profilePhoto?.getDirectURL();

  return (
    <div className="container px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Salon Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUploadField
              label="Profile Photo (Shop Logo or Owner Photo)"
              currentImageUrl={currentPhotoUrl}
              onChange={setProfilePhoto}
            />

            <div className="space-y-2">
              <Label htmlFor="name">Shop Name</Label>
              <Input
                id="name"
                placeholder="Enter your salon name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter your salon address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                type="tel"
                placeholder="Enter contact number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Opening Hours</Label>
              <Input
                id="hours"
                placeholder="e.g., Mon-Sat: 9 AM - 8 PM"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={createOrUpdateSalon.isPending || uploadProfilePhoto.isPending}
            >
              {(createOrUpdateSalon.isPending || uploadProfilePhoto.isPending) ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
