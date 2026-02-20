import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetSalon, useGetSalonServices, useGetSalonReviews, useGetUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { MapPin, Phone, Clock, Star } from 'lucide-react';

export default function SalonDetailPage() {
  const { salonId } = useParams({ from: '/salons/$salonId' });
  const navigate = useNavigate();
  const { data: salon, isLoading: salonLoading } = useGetSalon(salonId);
  const { data: services } = useGetSalonServices(salonId);
  const { data: reviews } = useGetSalonReviews(salonId);

  if (salonLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading salon details...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="container px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Salon not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const averageRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
    : 0;

  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start gap-4">
            <img 
              src="/assets/generated/salon-chair-icon.dim_64x64.png" 
              alt={salon.name}
              className="w-16 h-16"
            />
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{salon.name}</CardTitle>
              {reviews && reviews.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= averageRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {averageRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{salon.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{salon.contactNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{salon.openingHours}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          {!services || services.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No services available</p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.id.toString()} className="flex justify-between items-center">
                  <span className="font-medium">{service.name}</span>
                  <span className="text-primary font-semibold">₹{Number(service.price)}</span>
                </div>
              ))}
            </div>
          )}
          {services && services.length > 0 && (
            <Button 
              onClick={() => navigate({ to: '/salons/$salonId/book', params: { salonId } })}
              className="w-full mt-6"
            >
              Book Appointment
            </Button>
          )}
        </CardContent>
      </Card>

      {reviews && reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <ReviewItem key={index} review={review} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReviewItem({ review }: { review: any }) {
  const { data: userProfile } = useGetUserProfile(review.customer);

  return (
    <div className="border-b last:border-0 pb-4 last:pb-0">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= Number(review.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{userProfile?.name || 'Customer'}</span>
      </div>
      {review.comment && (
        <p className="text-sm text-muted-foreground">{review.comment}</p>
      )}
    </div>
  );
}
