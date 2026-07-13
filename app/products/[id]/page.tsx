// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { ProductCard } from '@/components/shared/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Heart, Share2, Truck, ShieldCheck, RotateCcw, Minus, Plus, ChevronRight, MessageSquare, MessagesSquare, GitCompare } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { formatPrice, calculateDiscountPercent, getEffectivePrice } from '@/lib/constants';
import type { Product, ProductImage, Review, Vendor, ProductQuestion } from '@/lib/types';
import { toast } from 'sonner';

const COMPARE_KEY = 'compare_list';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [inCompare, setInCompare] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [questionForm, setQuestionForm] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [answerForm, setAnswerForm] = useState<Record<string, string>>({});
  const [submittingAnswerId, setSubmittingAnswerId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: prod } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
      if (!prod) {
        setLoading(false);
        return;
      }
      setProduct(prod as Product);

      const [imgsRes, revsRes, relatedRes, questionsRes] = await Promise.all([
        supabase.from('product_images').select('*').eq('product_id', id).order('position'),
        supabase.from('reviews').select('*, profiles(first_name, last_name)').eq('product_id', id).order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('category_id', (prod as Product).category_id).neq('id', id).limit(4),
        supabase.from('product_questions').select('*, profiles(first_name, last_name)').eq('product_id', id).order('created_at', { ascending: false }),
      ]);

      setImages((imgsRes.data as ProductImage[]) ?? []);
      setReviews((revsRes.data as Review[]) ?? []);
      setRelated((relatedRes.data as Product[]) ?? []);
      setQuestions((questionsRes.data as ProductQuestion[]) ?? []);

      if ((prod as Product).vendor_id) {
        const { data: v } = await supabase.from('vendors').select('*').eq('id', (prod as Product).vendor_id).maybeSingle();
        setVendor(v as Vendor | null);
      }

      // Check wishlist
      if (user) {
        const { data: wl } = await supabase.from('wishlist').select('id').eq('user_id', user.id).eq('product_id', id).maybeSingle();
        setLiked(!!wl);
      }

      // Check compare list
      try {
        const compareRaw = localStorage.getItem(COMPARE_KEY);
        const compareList: string[] = compareRaw ? JSON.parse(compareRaw) : [];
        setInCompare(compareList.includes(id));
      } catch {
        setInCompare(false);
      }

      setLoading(false);
    })();
  }, [id, user]);

  const handleAddToCart = async () => {
    await addToCart(product!.id, quantity);
  };

  const handleBuyNow = async () => {
    await addToCart(product!.id, quantity);
    router.push('/checkout');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url: window.location.href });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error('Please log in to use wishlist');
      return;
    }
    if (liked) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', id);
      setLiked(false);
      toast.success('Removed from wishlist');
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, product_id: id });
      setLiked(true);
      toast.success('Added to wishlist');
    }
  };

  const toggleCompare = () => {
    try {
      const compareRaw = localStorage.getItem(COMPARE_KEY);
      let compareList: string[] = compareRaw ? JSON.parse(compareRaw) : [];
      if (compareList.includes(id)) {
        compareList = compareList.filter((p) => p !== id);
        localStorage.setItem(COMPARE_KEY, JSON.stringify(compareList));
        setInCompare(false);
        toast.success('Removed from comparison');
      } else {
        if (compareList.length >= 4) {
          toast.error('You can compare up to 4 products');
          return;
        }
        compareList.push(id);
        localStorage.setItem(COMPARE_KEY, JSON.stringify(compareList));
        setInCompare(true);
        toast.success('Added to comparison');
      }
    } catch {
      toast.error('Could not update comparison list');
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to leave a review');
      return;
    }
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: id,
      user_id: user.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    });
    setSubmittingReview(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Review posted!');
    setReviewForm({ rating: 5, comment: '' });
    // Refresh reviews
    const { data: revs } = await supabase.from('reviews').select('*, profiles(first_name, last_name)').eq('product_id', id).order('created_at', { ascending: false });
    setReviews((revs as Review[]) ?? []);
  };

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to ask a question');
      return;
    }
    if (!questionForm.trim()) return;
    setSubmittingQuestion(true);
    const { error } = await supabase.from('product_questions').insert({
      product_id: id,
      asker_id: user.id,
      question: questionForm.trim(),
    });
    setSubmittingQuestion(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Question posted!');
    setQuestionForm('');
    // Refresh questions
    const { data: qs } = await supabase.from('product_questions').select('*, profiles(first_name, last_name)').eq('product_id', id).order('created_at', { ascending: false });
    setQuestions((qs as ProductQuestion[]) ?? []);
  };

  const submitAnswer = async (questionId: string) => {
    const answerText = answerForm[questionId]?.trim();
    if (!answerText) return;
    setSubmittingAnswerId(questionId);
    const { error } = await supabase.from('product_questions').update({
      answer: answerText,
      answered_at: new Date().toISOString(),
    }).eq('id', questionId);
    setSubmittingAnswerId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Answer posted!');
    setAnswerForm((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    // Refresh questions
    const { data: qs } = await supabase.from('product_questions').select('*, profiles(first_name, last_name)').eq('product_id', id).order('created_at', { ascending: false });
    setQuestions((qs as ProductQuestion[]) ?? []);
  };

  const handleChatWithSeller = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!product?.vendor_id) {
      toast.error('Seller information unavailable');
      return;
    }
    if (product.vendor_id === user.id) {
      toast.error('You cannot chat with yourself');
      return;
    }
    try {
      // Check for existing conversation (either direction)
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('type', 'customer_seller')
        .eq('product_id', id)
        .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${product.vendor_id}),and(participant1_id.eq.${product.vendor_id},participant2_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        router.push(`/chat?id=${existing.id}`);
        return;
      }

      // Create new conversation
      const { data: created, error } = await supabase
        .from('chat_conversations')
        .insert({
          participant1_id: user.id,
          participant2_id: product.vendor_id,
          type: 'customer_seller',
          product_id: id,
          status: 'active',
        })
        .select('id')
        .single();

      if (error) {
        toast.error(error.message);
        return;
      }
      router.push(`/chat?id=${created.id}`);
    } catch (err) {
      toast.error('Could not start chat');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container-page flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="container-page py-24 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Button asChild className="mt-4"><Link href="/categories">Browse Products</Link></Button>
        </div>
      </>
    );
  }

  const discount = calculateDiscountPercent(product.price, product.discount_price);
  const effectivePrice = getEffectivePrice(product);
  const allImages = images.length > 0 ? images : [{ id: 'main', product_id: id, image_url: product.image_url ?? '', position: 0, created_at: '' }];
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : product.rating.toFixed(1);
  const specEntries = product.specifications ? Object.entries(product.specifications) : [];
  const isVendor = !!user && !!product.vendor_id && product.vendor_id === user.id;

  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <>
      <Navbar />
      <main className="container-page py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/categories" className="hover:text-primary">Categories</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={allImages[activeImage]?.image_url} alt={product.name} className="h-full w-full object-cover" />
              {discount > 0 && (
                <span className="absolute left-3 top-3 rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">
                  -{discount}%
                </span>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {allImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${activeImage === i ? 'border-primary' : 'border-transparent'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-4">
            <div>
              {product.brand && <p className="text-sm font-medium text-primary">{product.brand}</p>}
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{product.name}</h1>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-4 w-4 ${n <= Math.round(Number(avgRating)) ? 'fill-secondary text-secondary' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
                <span className="text-sm font-medium">{avgRating}</span>
                <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-primary">{formatPrice(effectivePrice)}</span>
              {discount > 0 && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock ({product.stock} available)</Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
              {product.is_featured && <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Featured</Badge>}
            </div>

            {/* Seller info */}
            {vendor && (
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                    <span className="font-semibold text-primary">{vendor.business_name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{vendor.business_name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-secondary text-secondary" />
                      <span className="text-xs text-muted-foreground">Verified Seller</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {!isVendor ? (
                    <Button size="sm" variant="outline" className="flex-1" onClick={handleChatWithSeller}>
                      <MessagesSquare className="mr-2 h-4 w-4" /> Chat with Seller
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1" disabled>
                      <MessagesSquare className="mr-2 h-4 w-4" /> Your Store
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Quantity + actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-lg border">
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={product.stock === 0}>
                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
              </Button>
              <Button size="lg" variant="secondary" className="flex-1" onClick={handleBuyNow} disabled={product.stock === 0}>
                Buy Now
              </Button>
              <Button size="icon" variant="outline" onClick={toggleWishlist} aria-label="Wishlist">
                <Heart className={`h-5 w-5 ${liked ? 'fill-destructive text-destructive' : ''}`} />
              </Button>
              <Button size="icon" variant="outline" onClick={toggleCompare} aria-label="Compare">
                <GitCompare className={`h-5 w-5 ${inCompare ? 'text-primary' : ''}`} />
              </Button>
              <Button size="icon" variant="outline" onClick={handleShare} aria-label="Share">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {inCompare && (
              <Link href="/compare" className="block text-sm text-primary hover:underline">
                View comparison list →
              </Link>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck className="h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">Fast Delivery</p>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">Secure Payment</p>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <RotateCcw className="h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">Easy Returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description + Specifications */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-display text-lg font-bold mb-3">Product Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description ?? 'No description available.'}</p>
              {product.tags && product.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-display text-lg font-bold mb-3">Specifications</h2>
              {specEntries.length > 0 ? (
                <dl className="divide-y">
                  {specEntries.map(([key, val]) => (
                    <div key={key} className="flex justify-between py-2">
                      <dt className="text-sm text-muted-foreground">{key}</dt>
                      <dd className="text-sm font-medium">{val}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">No specifications available.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reviews */}
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold mb-4">Customer Reviews ({reviews.length})</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {reviews.length === 0 ? (
                <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No reviews yet. Be the first to review!</CardContent></Card>
              ) : (
                reviews.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
                            {(r.profiles?.first_name ?? 'U')[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">
                            {r.profiles?.first_name ?? 'Anonymous'} {r.profiles?.last_name ?? ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? 'fill-secondary text-secondary' : 'text-muted-foreground/30'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.comment ?? ''}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Review form */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Write a Review
                </h3>
                <form onSubmit={submitReview} className="space-y-3">
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}>
                          <Star className={`h-6 w-6 transition-colors ${n <= reviewForm.rating ? 'fill-secondary text-secondary' : 'text-muted-foreground/30'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment">Comment</Label>
                    <Textarea
                      id="comment"
                      rows={4}
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                      placeholder="Share your thoughts..."
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submittingReview}>
                    {submittingReview ? 'Posting...' : 'Post Review'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Questions & Answers */}
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold mb-4">Questions & Answers ({questions.length})</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {questions.length === 0 ? (
                <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No questions yet. Ask the first question!</CardContent></Card>
              ) : (
                questions.map((q) => (
                  <Card key={q.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
                            {(q.profiles?.first_name ?? 'U')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <span className="block text-sm font-medium">
                              {q.profiles?.first_name ?? 'Anonymous'} {q.profiles?.last_name ?? ''}
                            </span>
                            <span className="block text-xs text-muted-foreground">{formatDate(q.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-2">Q: {q.question}</p>
                      {q.answer ? (
                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">A:</span> {q.answer}
                          </p>
                          {q.answered_at && (
                            <p className="mt-1 text-xs text-muted-foreground">Answered on {formatDate(q.answered_at)}</p>
                          )}
                        </div>
                      ) : isVendor ? (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            rows={2}
                            placeholder="Write an answer..."
                            value={answerForm[q.id] ?? ''}
                            onChange={(e) => setAnswerForm((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          />
                          <Button
                            size="sm"
                            onClick={() => submitAnswer(q.id)}
                            disabled={submittingAnswerId === q.id || !(answerForm[q.id]?.trim())}
                          >
                            {submittingAnswerId === q.id ? 'Posting...' : 'Post Answer'}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Not answered yet</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Question form */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Ask a Question
                </h3>
                {user ? (
                  <form onSubmit={submitQuestion} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="question">Your Question</Label>
                      <Textarea
                        id="question"
                        rows={4}
                        value={questionForm}
                        onChange={(e) => setQuestionForm(e.target.value)}
                        placeholder="Ask about this product..."
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={submittingQuestion}>
                      {submittingQuestion ? 'Posting...' : 'Post Question'}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-3 text-center">
                    <p className="text-sm text-muted-foreground">Log in to ask a question about this product.</p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login">Log In</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-bold mb-4">Related Products</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
