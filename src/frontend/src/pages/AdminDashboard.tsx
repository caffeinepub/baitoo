import { useState } from 'react';
import { useIsCallerAdmin, useAdminGetAllSalons, useAdminGetAllUsers, useAdminDeleteSalon, useAdminDeleteUser } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { data: isAdmin, isLoading: adminCheckLoading } = useIsCallerAdmin();
  const { data: salons } = useAdminGetAllSalons();
  const { data: users } = useAdminGetAllUsers();
  const deleteSalon = useAdminDeleteSalon();
  const deleteUser = useAdminDeleteUser();

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
                <div className="space-y-3">
                  {salons.map((salon) => (
                    <div key={salon.id.toString()} className="flex justify-between items-start p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{salon.name}</p>
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
