// @ts-nocheck
'use client'

import Link from 'next/link';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { formatPrice, calculateDiscountPercent, getEffectivePrice } from '@/lib/constants';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.id);
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((l) => !l);
    if (user && !liked) {
      await supabase.from('wishlist').insert({ user_id: user.id, product_id: product.id });
      toast.success('Added to wishlist');
    } else if (user && liked) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', product.id);
      toast.success('Removed from wishlist');
    }
  };

  const discount = calculateDiscountPercent(product.price, product.discount_price);
  const effectivePrice = getEffectivePrice(product);

  return (
    <Link href={`/products/${product.id}`} className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            No image
          </div>
        )}
        <button
          onClick={toggleWishlist}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-background"
          aria-label="Toggle wishlist"
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
        </button>
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
            -{discount}%
          </span>
        )}
        {product.is_featured && (
          <span className="absolute bottom-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        {product.brand && (
          <p className="text-xs text-muted-foreground font-medium">{product.brand}</p>
        )}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
        {product.description && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{product.description}</p>
        )}
        <div className="mt-1 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
          <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
          {product.stock <= 5 && product.stock > 0 && (
            <span className="ml-auto text-[10px] text-destructive font-medium">Only {product.stock} left</span>
          )}
        </div>
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-display text-base font-bold text-primary">{formatPrice(effectivePrice)}</span>
            {discount > 0 && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
            )}
          </div>
          <Button size="icon" className="h-8 w-8" onClick={handleAddToCart} aria-label="Add to cart">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
