// @ts-nocheck
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { formatPrice } from '@/lib/constants';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/shared/product-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Star, MapPin, Users, Mail, Phone, Store, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Vendor {
  id: string;
  business_name: string;
  owner_name: string | null;
  business_email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  business_address: string | null;
  business_category: string | null;
  logo_url: string | null;
  slug: string | null;
  description: string | null;
  banner_url: string | null;
  rating: number;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  created_at: string;
}

interface Review {
  id: string;
  vendor_id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
}

interface Product {
  id: string;
  vendor_id: string | null;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  image_url: string | null;
  stock: number;
  brand: string | null;
  rating: number;
  is_featured: boolean;
  status: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function StarRating({
  rating,
  size = 'sm',
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted-foreground/40'
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function StorePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  /* ---------------- Fetch vendor + related data ---------------- */
  const fetchStoreData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);

    try {
      // 1. Fetch the approved vendor by slug
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'approved')
        .maybeSingle();

      if (vendorError || !vendorData) {
        setVendor(null);
        setLoading(false);
        return;
      }

      setVendor(vendorData as Vendor);

      // 2. Fetch published products for this vendor
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!productsError && productsData) {
        setProducts(productsData as Product[]);
      }

      // 3. Fetch reviews with reviewer names (join profiles)
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('store_reviews')
        .select(
          'id, vendor_id, reviewer_id, rating, comment, created_at, profiles!store_reviews_reviewer_id_fkey(first_name, last_name)'
        )
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (!reviewsError && reviewsData) {
        const mapped: Review[] = (reviewsData as any[]).map((r) => {
          const p = r.profiles as any;
          const first = p?.first_name ?? '';
          const last = p?.last_name ?? '';
          const fullName = `${first} ${last}`.trim();
          return {
            id: r.id,
            vendor_id: r.vendor_id,
            reviewer_id: r.reviewer_id,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
            reviewer_name: fullName || 'Anonymous Customer',
          };
        });
        setReviews(mapped);
      }

      // 4. Follower count
      const { count } = await supabase
        .from('store_follows')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', vendorData.id);

      setFollowerCount(count ?? 0);

      // 5. Check if current user follows this store
      if (user?.id) {
        const { data: followRow } = await supabase
          .from('store_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('vendor_id', vendorData.id)
          .maybeSingle();
        setIsFollowing(!!followRow);
      }
    } catch (err) {
      console.error('Error fetching store data:', err);
      setVendor(null);
    } finally {
      setLoading(false);
    }
  }, [slug, user?.id]);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  /* ---------------- Follow / Unfollow ---------------- */
  const toggleFollow = async () => {
    if (!user) {
      toast.error('Please log in to follow this store.');
      return;
    }
    if (!vendor) return;

    // Prevent a vendor from following their own store
    if (user.id === vendor.id) {
      toast.error('You cannot follow your own store.');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('store_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('vendor_id', vendor.id);

        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
        toast.success(`Unfollowed ${vendor.business_name}.`);
      } else {
        const { error } = await supabase
          .from('store_follows')
          .insert({ follower_id: user.id, vendor_id: vendor.id });

        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
        toast.success(`Following ${vendor.business_name}!`);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  /* ---------------- Submit a review ---------------- */
  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to leave a review.');
      return;
    }
    if (!vendor) return;
    if (reviewRating < 1 || reviewRating > 5) {
      toast.error('Please select a rating between 1 and 5.');
      return;
    }
    if (!reviewComment.trim()) {
      toast.error('Please write a comment for your review.');
      return;
    }

    setSubmittingReview(true);
    try {
      const { data, error } = await supabase
        .from('store_reviews')
        .insert({
          vendor_id: vendor.id,
          reviewer_id: user.id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        })
        .select('id, vendor_id, reviewer_id, rating, comment, created_at')
        .single();

      if (error) throw error;

      const first = profile?.first_name ?? '';
      const last = profile?.last_name ?? '';
      const fullName = `${first} ${last}`.trim() || 'Anonymous Customer';

      const newReview: Review = {
        ...(data as any),
        reviewer_name: fullName,
      };
      setReviews((r) => [newReview, ...r]);
      setReviewComment('');
      setReviewRating(5);
      toast.success('Thank you for your review!');
    } catch (err) {
      console.error('Review submission error:', err);
      toast.error('Could not submit your review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  /* ---------------- Loading state ---------------- */
  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading store…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* ---------------- Not found ---------------- */
  if (!vendor) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-12 pb-12 px-6 flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Store className="h-8 w-8 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Store not found
              </h1>
              <p className="text-muted-foreground text-sm">
                The store you&apos;re looking for doesn&apos;t exist, is no
                longer active, or has not been approved yet.
              </p>
              <Button asChild className="mt-2">
                <a href="/">Back to Home</a>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  const isOwner = !!user && user.id === vendor.id;
  const locationParts = [vendor.city, vendor.country].filter(Boolean);
  const hasLocation = locationParts.length > 0;

  /* ---------------- Render ---------------- */
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* ---------- Banner ---------- */}
        <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden bg-gray-200">
          {vendor.banner_url ? (
            <Image
              src={vendor.banner_url}
              alt={`${vendor.business_name} banner`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary via-primary/80 to-primary/60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* ---------- Store header ---------- */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            {/* Logo */}
            <div className="shrink-0">
              {vendor.logo_url ? (
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white">
                  <Image
                    src={vendor.logo_url}
                    alt={`${vendor.business_name} logo`}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-white shadow-lg bg-primary flex items-center justify-center">
                  <Store className="h-12 w-12 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 pb-2 sm:pb-4">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {vendor.business_name}
                </h1>
                {vendor.business_category && (
                  <Badge variant="secondary">{vendor.business_category}</Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {vendor.rating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <StarRating rating={vendor.rating} />
                    <span className="font-medium text-gray-700">
                      {Number(vendor.rating).toFixed(1)}
                    </span>
                  </span>
                )}
                {hasLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {locationParts.join(', ')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
                </span>
              </div>
            </div>

            {/* Follow button */}
            <div className="pb-2 sm:pb-4">
              {user && !isOwner ? (
                <Button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  variant={isFollowing ? 'outline' : 'default'}
                  size="lg"
                  className="min-w-[140px]"
                >
                  {followLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFollowing ? (
                    'Following'
                  ) : (
                    'Follow Store'
                  )}
                </Button>
              ) : user && isOwner ? (
                <Badge variant="outline" className="text-sm py-1.5 px-3">
                  Your Store
                </Badge>
              ) : null}
            </div>
          </div>

          {/* ---------- Body grid ---------- */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-16">
            {/* Left column: description + contact */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About this store</CardTitle>
                </CardHeader>
                <CardContent>
                  {vendor.description ? (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {vendor.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      This store hasn&apos;t added a description yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              {(vendor.contact_email || vendor.contact_phone) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {vendor.contact_email && (
                      <a
                        href={`mailto:${vendor.contact_email}`}
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{vendor.contact_email}</span>
                      </a>
                    )}
                    {vendor.contact_phone && (
                      <a
                        href={`tel:${vendor.contact_phone}`}
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>{vendor.contact_phone}</span>
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right column: products + reviews */}
            <div className="lg:col-span-2 space-y-8">
              {/* ---------- Products ---------- */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Products
                  </h2>
                  {products.length > 0 && (
                    <Badge variant="outline">
                      {products.length}{' '}
                      {products.length === 1 ? 'item' : 'items'}
                    </Badge>
                  )}
                </div>

                {products.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product as any} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Store className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        This store hasn&apos;t listed any products yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </section>

              {/* ---------- Reviews ---------- */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Store Reviews
                </h2>

                {/* Review form (logged-in users only) */}
                {user ? (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Write a review</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={submitReview} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Rating</Label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setReviewRating(i)}
                                className="p-1 transition-transform hover:scale-110"
                                aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
                              >
                                <Star
                                  className={`h-7 w-7 ${
                                    i <= reviewRating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-muted text-muted-foreground/40'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="ml-2 text-sm font-medium text-muted-foreground">
                              {reviewRating} / 5
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="review-comment">Comment</Label>
                          <Textarea
                            id="review-comment"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Share your experience with this store…"
                            rows={4}
                            maxLength={1000}
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={submittingReview}
                        >
                          {submittingReview ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Submitting…
                            </>
                          ) : (
                            'Submit Review'
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="mb-6">
                    <CardContent className="py-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        <a
                          href="/login"
                          className="text-primary font-medium hover:underline"
                        >
                          Log in
                        </a>{' '}
                        to write a review for this store.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews list */}
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="pt-5">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                {review.reviewer_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {review.reviewer_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString(
                                    'en-GH',
                                    {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                            <StarRating rating={review.rating} />
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                              {review.comment}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <Star className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No reviews yet. Be the first to review this store!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
