import { createRouter, RouterProvider, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useReminderChecker } from './hooks/useReminderChecker';
import { useCustomerNotifications } from './hooks/useCustomerNotifications';
import AppLayout from './components/layout/AppLayout';
import ProfileSetupModal from './components/auth/ProfileSetupModal';
import SalonDiscoveryPage from './pages/SalonDiscoveryPage';
import SalonDetailPage from './pages/SalonDetailPage';
import BookingPage from './pages/BookingPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import CustomerBookingsPage from './pages/CustomerBookingsPage';
import SalonProfilePage from './pages/SalonProfilePage';
import ServiceManagementPage from './pages/ServiceManagementPage';
import TimeSlotManagementPage from './pages/TimeSlotManagementPage';
import SalonBookingsDashboard from './pages/SalonBookingsDashboard';
import AdminDashboard from './pages/AdminDashboard';
import WelcomePage from './pages/WelcomePage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import SalonReviewsPage from './pages/SalonReviewsPage';

function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  
  // Initialize push notifications for authenticated users
  usePushNotifications();
  
  // Initialize reminder checker for salon owners
  useReminderChecker();
  
  // Initialize customer notifications
  useCustomerNotifications();
  
  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing || (isAuthenticated && !isFetched)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppLayout>
        <Outlet />
      </AppLayout>
      {showProfileSetup && <ProfileSetupModal />}
    </>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: WelcomePage,
});

const salonDiscoveryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/salons',
  component: SalonDiscoveryPage,
});

const salonDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/salons/$salonId',
  component: SalonDetailPage,
});

const bookingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/salons/$salonId/book',
  component: BookingPage,
});

const bookingConfirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bookings/$bookingId/confirmation',
  component: BookingConfirmationPage,
});

const customerBookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-bookings',
  component: CustomerBookingsPage,
});

const customerProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/customer-profile',
  component: CustomerProfilePage,
});

const salonProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/salon-profile',
  component: SalonProfilePage,
});

const serviceManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/salon/services',
  component: ServiceManagementPage,
});

const timeSlotManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/salon/time-slots',
  component: TimeSlotManagementPage,
});

const salonBookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/salon/bookings',
  component: SalonBookingsDashboard,
});

const salonReviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/salon-reviews',
  component: SalonReviewsPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboard,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  salonDiscoveryRoute,
  salonDetailRoute,
  bookingRoute,
  bookingConfirmationRoute,
  customerBookingsRoute,
  customerProfileRoute,
  salonProfileRoute,
  serviceManagementRoute,
  timeSlotManagementRoute,
  salonBookingsRoute,
  salonReviewsRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
