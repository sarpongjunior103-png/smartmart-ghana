// @ts-nocheck
'use client'

import Link from 'next/link';
import * as Icons from 'lucide-react';
import { Category } from '@/lib/types';

interface CategoryCardProps {
  category: Category;
  productCount?: number;
}

export function CategoryCard({ category, productCount }: CategoryCardProps) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[category.icon ?? 'Tag'] ?? Icons.Tag;

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/40"
    >
      <div className="relative h-16 w-16 overflow-hidden rounded-full bg-accent flex items-center justify-center transition-colors group-hover:bg-primary/10">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <div className="text-center">
        <p className="font-display text-sm font-semibold">{category.name}</p>
        {productCount !== undefined && (
          <p className="text-xs text-muted-foreground">{productCount} items</p>
        )}
      </div>
    </Link>
  );
}
