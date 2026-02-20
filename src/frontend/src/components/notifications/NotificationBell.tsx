import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { useNotifications, useUpdateNotificationStatus, useGetBooking } from '../../hooks/useQueries';
import { useGetCallerUserProfile } from '../../hooks/useQueries';
import BookingNotificationCard from './BookingNotificationCard';
import { NotificationType, DeliveryStatus } from '../../backend';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: notifications, refetch } = useNotifications();
  const updateStatus = useUpdateNotificationStatus();

  // Only show for salon owners
  if (!userProfile || userProfile.userType !== 'salon_owner') {
    return null;
  }

  // Filter for new booking notifications that are pending
  const pendingNotifications = notifications?.filter(
    n => n.notificationType === NotificationType.bookingReminder && 
         n.deliveryStatus === DeliveryStatus.pending
  ) || [];

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    
    // Mark notifications as delivered when opened
    if (isOpen && pendingNotifications.length > 0) {
      for (const notification of pendingNotifications) {
        try {
          await updateStatus.mutateAsync({
            notificationId: notification.bookingId,
            status: DeliveryStatus.delivered,
          });
        } catch (error) {
          console.error('Error updating notification status:', error);
        }
      }
    }
  };

  const handleActionComplete = () => {
    refetch();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pendingNotifications.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {pendingNotifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Booking Notifications</h3>
          <p className="text-sm text-muted-foreground">
            {pendingNotifications.length} pending booking{pendingNotifications.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-4">
            {pendingNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No pending notifications</p>
              </div>
            ) : (
              pendingNotifications.map((notification) => (
                <NotificationCardWrapper
                  key={notification.bookingId.toString()}
                  bookingId={notification.bookingId}
                  onActionComplete={handleActionComplete}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function NotificationCardWrapper({ 
  bookingId, 
  onActionComplete 
}: { 
  bookingId: bigint; 
  onActionComplete: () => void;
}) {
  const { data: booking } = useGetBooking(bookingId.toString());

  if (!booking) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  return <BookingNotificationCard booking={booking} onActionComplete={onActionComplete} />;
}
