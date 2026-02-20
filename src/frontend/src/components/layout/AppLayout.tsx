import { ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useQueries';
import LoginButton from '../auth/LoginButton';
import NotificationBell from '../notifications/NotificationBell';
import MobileNav from './MobileNav';
import { Link } from '@tanstack/react-router';
import { User } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  
  const isAuthenticated = !!identity;

  const handleProfileClick = () => {
    if (userProfile?.userType === 'salon_owner') {
      navigate({ to: '/salon-profile' });
    } else {
      navigate({ to: '/customer-profile' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-primary">Baitoo</div>
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated && userProfile && (
              <button
                onClick={handleProfileClick}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                aria-label="View profile"
              >
                <User className="h-5 w-5 text-primary" />
              </button>
            )}
            {isAuthenticated && <NotificationBell />}
            <LoginButton />
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-4">
        {children}
      </main>

      {isAuthenticated && userProfile && (
        <MobileNav userType={userProfile.userType} />
      )}

      <footer className="border-t py-6 md:py-8 bg-muted/30">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Baitoo. Built with ❤️ using{' '}
            <a 
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
