import { createRouter, RouterProvider, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
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

function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  
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

const salonProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/salon/profile',
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
  salonProfileRoute,
  serviceManagementRoute,
  timeSlotManagementRoute,
  salonBookingsRoute,
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
