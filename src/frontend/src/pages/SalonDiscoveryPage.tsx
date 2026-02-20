import { useNavigate } from '@tanstack/react-router';
import { useGetAllSalons } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MapPin, Phone, Clock } from 'lucide-react';

export default function SalonDiscoveryPage() {
  const navigate = useNavigate();
  const { data: salons, isLoading } = useGetAllSalons();

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading salons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Salons in Faizabad</h1>
        <p className="text-muted-foreground">Find and book your next appointment</p>
      </div>

      {!salons || salons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <img 
              src="/assets/generated/salon-chair-icon.dim_64x64.png" 
              alt="No salons" 
              className="w-16 h-16 mx-auto mb-4 opacity-50"
            />
            <p className="text-muted-foreground">No salons available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {salons.map((salon) => (
            <Card key={salon.id.toString()} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <img 
                      src="/assets/generated/salon-chair-icon.dim_64x64.png" 
                      alt={salon.name}
                      className="w-12 h-12"
                    />
                    <div>
                      <CardTitle className="text-xl">{salon.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{salon.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{salon.contactNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{salon.openingHours}</span>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate({ to: '/salons/$salonId', params: { salonId: salon.id.toString() } })}
                  className="w-full"
                >
                  View Details & Book
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
