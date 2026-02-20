import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Scissors, Calendar, Star } from 'lucide-react';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();

  useEffect(() => {
    if (identity && userProfile) {
      if (userProfile.userType === 'customer') {
        navigate({ to: '/salons' });
      } else if (userProfile.userType === 'salon_owner') {
        navigate({ to: '/salon-profile' });
      }
    }
  }, [identity, userProfile, navigate]);

  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <img 
          src="/assets/generated/hero-banner.dim_1200x400.png" 
          alt="Baitoo - Salon Booking" 
          className="w-full rounded-lg shadow-lg mb-8"
        />
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Welcome to Baitoo
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your trusted salon booking platform in Faizabad
        </p>
        {!identity && (
          <p className="text-lg text-muted-foreground">
            Please login to get started
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-card rounded-lg p-6 text-center border shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Find Salons</h3>
          <p className="text-sm text-muted-foreground">
            Browse local salons and their services
          </p>
        </div>

        <div className="bg-card rounded-lg p-6 text-center border shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Book Appointments</h3>
          <p className="text-sm text-muted-foreground">
            Choose your time slot and book instantly
          </p>
        </div>

        <div className="bg-card rounded-lg p-6 text-center border shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Leave Reviews</h3>
          <p className="text-sm text-muted-foreground">
            Share your experience with others
          </p>
        </div>
      </div>
    </div>
  );
}
