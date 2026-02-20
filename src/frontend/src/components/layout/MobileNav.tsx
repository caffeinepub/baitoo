import { Link, useRouterState } from '@tanstack/react-router';
import { Home, Calendar, Store, Settings, Shield } from 'lucide-react';
import { useIsCallerAdmin } from '../../hooks/useQueries';

interface MobileNavProps {
  userType: string;
}

export default function MobileNav({ userType }: MobileNavProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { data: isAdmin } = useIsCallerAdmin();

  const isCustomer = userType === 'customer';
  const isSalonOwner = userType === 'salon_owner';

  const customerLinks = [
    { to: '/salons', icon: Home, label: 'Salons' },
    { to: '/my-bookings', icon: Calendar, label: 'Bookings' },
  ];

  const salonOwnerLinks = [
    { to: '/salon/profile', icon: Store, label: 'Profile' },
    { to: '/salon/services', icon: Settings, label: 'Services' },
    { to: '/salon/bookings', icon: Calendar, label: 'Bookings' },
  ];

  const links = isCustomer ? customerLinks : isSalonOwner ? salonOwnerLinks : [];

  if (isAdmin) {
    links.push({ to: '/admin', icon: Shield, label: 'Admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentPath === link.to || currentPath.startsWith(link.to + '/');
          
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
