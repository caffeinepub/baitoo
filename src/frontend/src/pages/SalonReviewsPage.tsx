import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetSalonReviews, useGetUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Star } from 'lucide-react';

export default function SalonReviewsPage() {
  const { identity } = useInternetIdentity();
  const salonId = identity?.getPrincipal().toString();
  const { data: reviews, isLoading } = useGetSalonReviews(salonId);

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    );
  }

  // Sort reviews by timestamp (newest first)
  const sortedReviews = reviews ? [...reviews].sort((a, b) => Number(b.timestamp - a.timestamp)) : [];

  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Customer Reviews</h1>

      {!sortedReviews || sortedReviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No reviews yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedReviews.map((review, index) => (
            <ReviewCard key={index} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  const { data: userProfile } = useGetUserProfile(review.customer);
  const [showImageDialog, setShowImageDialog] = useState(false);

  const photoUrl = review.photo?.getDirectURL();
  const reviewDate = new Date(Number(review.timestamp) / 1000000);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{userProfile?.name || 'Customer'}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {reviewDate.toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Number(review.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {review.comment && (
            <p className="text-sm mb-3">{review.comment}</p>
          )}
          {photoUrl && (
            <div className="mt-3">
              <img
                src={photoUrl}
                alt="Review photo"
                className="w-40 h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border-2 border-border"
                onClick={() => setShowImageDialog(true)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {photoUrl && (
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Review Photo</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <img
                src={photoUrl}
                alt="Review photo full size"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
