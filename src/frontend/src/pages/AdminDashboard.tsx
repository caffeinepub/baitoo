import { useState } from 'react';
import { useIsCallerAdmin, useAdminGetAllSalons, useAdminGetAllUsers, useAdminDeleteSalon, useAdminDeleteUser, useUpdateSalonLocation } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Trash2, MapPin, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { data: isAdmin, isLoading: adminCheckLoading } = useIsCallerAdmin();
  const { data: salons } = useAdminGetAllSalons();
  const { data: users } = useAdminGetAllUsers();
  const deleteSalon = useAdminDeleteSalon();
  const deleteUser = useAdminDeleteUser();
  const updateLocation = useUpdateSalonLocation();

  // Track location inputs for each salon
  const [locationInputs, setLocationInputs] = useState<Record<string, { latitude: string; longitude: string }>>({});

  if (adminCheckLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container px-4 py-8 max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You do not have permission to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDeleteSalon = async (salonId: any) => {
    try {
      await deleteSalon.mutateAsync(salonId);
      toast.success('Salon deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete salon');
    }
  };

  const handleDeleteUser = async (userId: any) => {
    try {
      await deleteUser.mutateAsync(userId);
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleLocationChange = (salonId: string, field: 'latitude' | 'longitude', value: string) => {
    setLocationInputs(prev => ({
      ...prev,
      [salonId]: {
        ...prev[salonId],
        [field]: value,
      },
    }));
  };

  const handleSaveLocation = async (salonId: any) => {
    const inputs = locationInputs[salonId.toString()];
    
    if (!inputs || !inputs.latitude || !inputs.longitude) {
      toast.error('Please enter both latitude and longitude');
      return;
    }

    const latitude = parseFloat(inputs.latitude);
    const longitude = parseFloat(inputs.longitude);

    // Validate coordinate ranges
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }

    try {
      await updateLocation.mutateAsync({
        salonId,
        latitude,
        longitude,
      });
      toast.success('Location updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update location');
    }
  };

  // Initialize location inputs when salons load
  const getLocationValue = (salonId: string, field: 'latitude' | 'longitude', currentValue?: number) => {
    const input = locationInputs[salonId]?.[field];
    if (input !== undefined) return input;
    return currentValue !== undefined ? currentValue.toString() : '';
  };

  return (
    <div className="container px-4 py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="salons" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="salons">Salons</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="salons" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Salons</CardTitle>
            </CardHeader>
            <CardContent>
              {!salons || salons.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No salons registered</p>
              ) : (
                <div className="space-y-4">
                  {salons.map((salon) => (
                    <div key={salon.id.toString()} className="p-4 border rounded-lg space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">{salon.name}</p>
                          <p className="text-sm text-muted-foreground">{salon.address}</p>
                          <p className="text-sm text-muted-foreground">{salon.contactNumber}</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Salon</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {salon.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSalon(salon.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">GPS Location</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor={`lat-${salon.id.toString()}`} className="text-xs">
                              Latitude (-90 to 90)
                            </Label>
                            <Input
                              id={`lat-${salon.id.toString()}`}
                              type="number"
                              step="any"
                              placeholder="e.g., 26.7606"
                              value={getLocationValue(salon.id.toString(), 'latitude', salon.latitude)}
                              onChange={(e) => handleLocationChange(salon.id.toString(), 'latitude', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`lon-${salon.id.toString()}`} className="text-xs">
                              Longitude (-180 to 180)
                            </Label>
                            <Input
                              id={`lon-${salon.id.toString()}`}
                              type="number"
                              step="any"
                              placeholder="e.g., 82.1390"
                              value={getLocationValue(salon.id.toString(), 'longitude', salon.longitude)}
                              onChange={(e) => handleLocationChange(salon.id.toString(), 'longitude', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSaveLocation(salon.id)}
                          disabled={updateLocation.isPending}
                          size="sm"
                          className="mt-3"
                        >
                          <Save className="h-3 w-3 mr-2" />
                          {updateLocation.isPending ? 'Saving...' : 'Save Location'}
                        </Button>
                        {salon.latitude !== undefined && salon.longitude !== undefined && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Current: {salon.latitude.toFixed(6)}, {salon.longitude.toFixed(6)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              {!users || users.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No users registered</p>
              ) : (
                <div className="space-y-3">
                  {users.map(([principal, profile]) => (
                    <div key={principal.toString()} className="flex justify-between items-start p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{profile.name}</p>
                        <p className="text-sm text-muted-foreground">{profile.phoneNumber}</p>
                        <p className="text-sm text-muted-foreground capitalize">{profile.userType.replace('_', ' ')}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {profile.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(principal)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
