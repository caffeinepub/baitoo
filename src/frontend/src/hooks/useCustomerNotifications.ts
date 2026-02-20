import { useEffect, useRef } from 'react';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useGetCallerUserProfile } from './useQueries';
import { toast } from 'sonner';
import { NotificationType, DeliveryStatus } from '../backend';
import { useNavigate } from '@tanstack/react-router';

export function useCustomerNotifications() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const displayedNotifications = useRef<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (!actor || !identity || !userProfile || userProfile.userType !== 'customer') {
      return;
    }

    const checkNotifications = async () => {
      try {
        const notifications = await actor.getNotificationsForUser(identity.getPrincipal());
        
        for (const notification of notifications) {
          const notificationId = notification.bookingId.toString();
          
          // Skip if already displayed
          if (displayedNotifications.current.has(notificationId)) {
            continue;
          }

          // Only show pending notifications
          if (notification.deliveryStatus !== DeliveryStatus.pending) {
            continue;
          }

          // Get booking details
          const booking = await actor.getBooking(notification.bookingId);
          if (!booking) continue;

          const services = await actor.getSalonServices(booking.salonId);
          const service = services.find(s => s.id === booking.serviceId);
          const salon = await actor.getSalon(booking.salonId);

          // Show appropriate toast based on notification type
          if (notification.notificationType === NotificationType.bookingConfirmed) {
            toast.success('Booking Confirmed! ✅', {
              description: `Your booking at ${salon?.name || 'the salon'} for ${service?.name || 'service'} at ${booking.timeSlot} has been confirmed.`,
              action: {
                label: 'View Bookings',
                onClick: () => navigate({ to: '/my-bookings' }),
              },
              duration: 10000,
            });
          } else if (notification.notificationType === NotificationType.bookingCancelled) {
            toast.error('Booking Cancelled ❌', {
              description: `Your booking at ${salon?.name || 'the salon'} has been cancelled.${booking.cancellationReason ? `\nReason: ${booking.cancellationReason}` : ''}`,
              action: {
                label: 'View Bookings',
                onClick: () => navigate({ to: '/my-bookings' }),
              },
              duration: 10000,
            });
          }

          // Mark as displayed
          displayedNotifications.current.add(notificationId);

          // Update notification status to delivered
          await actor.updateNotificationStatus(notification.bookingId, DeliveryStatus.delivered);
        }
      } catch (error) {
        console.error('Error checking customer notifications:', error);
      }
    };

    // Check immediately
    checkNotifications();

    // Then check every 10 seconds
    const interval = setInterval(checkNotifications, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [actor, identity, userProfile, navigate]);
}
