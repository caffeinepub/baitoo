import { useEffect, useRef } from 'react';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useGetCallerUserProfile } from './useQueries';

export function useReminderChecker() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const sentReminders = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!actor || !identity || !userProfile || userProfile.userType !== 'salon_owner') {
      return;
    }

    const checkReminders = async () => {
      try {
        const pendingBookings = await actor.checkPendingBookingsForReminders();
        
        for (const [salonOwnerPrincipal, bookingId] of pendingBookings) {
          const bookingIdStr = bookingId.toString();
          
          // Skip if already sent in this session
          if (sentReminders.current.has(bookingIdStr)) {
            continue;
          }

          // Fetch booking details
          const booking = await actor.getBooking(bookingId);
          if (!booking) continue;

          // Get customer and service details
          const customer = await actor.getUserProfile(booking.customer);
          const services = await actor.getSalonServices(booking.salonId);
          const service = services.find(s => s.id === booking.serviceId);

          // Show notification via service worker
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SHOW_NOTIFICATION',
              title: '⏰ Booking Reminder',
              body: `Pending booking from ${customer?.name || 'Customer'}\nService: ${service?.name || 'Unknown'}\nTime: ${booking.timeSlot}`,
              data: {
                bookingId: bookingIdStr,
                type: 'reminder',
              },
            });
          }

          // Mark as sent in this session
          sentReminders.current.add(bookingIdStr);
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };

    // Check immediately
    checkReminders();

    // Then check every 60 seconds
    const interval = setInterval(checkReminders, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [actor, identity, userProfile]);
}
