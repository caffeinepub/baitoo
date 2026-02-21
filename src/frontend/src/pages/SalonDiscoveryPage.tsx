import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllSalons } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MapPin, Phone, Clock, Navigation } from 'lucide-react';
import { calculateDistance } from '../utils/distance';
import type { Salon } from '../backend';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export default function SalonDiscoveryPage() {
  const navigate = useNavigate();
  const { data: salons, isLoading } = useGetAllSalons();
  
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    // Request geolocation permission on component mount
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationPermission('granted');
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationPermission('denied');
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationPermission('denied');
      setIsLoadingLocation(false);
    }
  }, []);

  // Calculate distances and sort salons
  const sortedSalons = useMemo(() => {
    if (!salons) return [];

    // If location permission granted and user location available
    if (locationPermission === 'granted' && userLocation) {
      // Separate salons with and without coordinates
      const salonsWithCoords: Array<Salon & { distance: number }> = [];
      const salonsWithoutCoords: Salon[] = [];

      salons.forEach((salon) => {
        if (salon.latitude !== undefined && salon.longitude !== undefined) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            salon.latitude,
            salon.longitude
          );
          salonsWithCoords.push({ ...salon, distance });
        } else {
          salonsWithoutCoords.push(salon);
        }
      });

      // Sort salons with coordinates by distance
      salonsWithCoords.sort((a, b) => a.distance - b.distance);

      // Return salons with coords first, then without
      return [...salonsWithCoords, ...salonsWithoutCoords];
    }

    // If location permission denied or not available, return original order
    return salons;
  }, [salons, userLocation, locationPermission]);

  // Calculate distance for display
  const getDistance = (salon: Salon): number | null => {
    if (
      locationPermission === 'granted' &&
      userLocation &&
      salon.latitude !== undefined &&
      salon.longitude !== undefined
    ) {
      return calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        salon.latitude,
        salon.longitude
      );
    }
    return null;
  };

  // Dynamic heading based on location permission
  const heading = locationPermission === 'granted' && userLocation ? 'Nearby You' : 'Salons in Faizabad';

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
        <h1 className="text-3xl font-bold mb-2">{heading}</h1>
        <p className="text-muted-foreground">Find and book your next appointment</p>
        {isLoadingLocation && (
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            <Navigation className="h-4 w-4 animate-pulse" />
            Getting your location...
          </p>
        )}
      </div>

      {!sortedSalons || sortedSalons.length === 0 ? (
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
          {sortedSalons.map((salon) => {
            const distance = getDistance(salon);
            return (
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
                        {distance !== null && (
                          <div className="flex items-center gap-1 text-sm text-primary font-medium mt-1">
                            <Navigation className="h-3 w-3" />
                            <span>{distance} km away</span>
                          </div>
                        )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
