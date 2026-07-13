// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, X, Loader2, Save, Send } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import type { Category, ProductImage } from '@/lib/types';
import { toast } from 'sonner';

export default function ProductFormPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const isEdit = !!params.id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [specRows, setSpecRows] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);

  const [form, setForm] = useState({
    name: '', brand: '', description: '', price: '', discountPrice: '',
    stock: '', categoryId: '', isFeatured: false, status: 'pending' as 'pending' | 'draft',
    sku: '', barcode: '', videoUrl: '', shippingWeight: '', warranty: '', deliveryTime: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'vendor')) {
      router.push('/seller/register');
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, []);

  useEffect(() => {
    if (!isEdit || !params.id || !user) return;
    (async () => {
      const { data: prod } = await supabase.from('products').select('*').eq('id', params.id).eq('vendor_id', user.id).maybeSingle();
      if (prod) {
        const p = prod as any;
        setForm({
          name: p.name ?? '',
          brand: p.brand ?? '',
          description: p.description ?? '',
          price: p.price?.toString() ?? '',
          discountPrice: p.discount_price?.toString() ?? '',
          stock: p.stock?.toString() ?? '',
          categoryId: p.category_id ?? '',
          isFeatured: p.is_featured ?? false,
          status: p.status ?? 'pending',
          sku: p.sku ?? '',
          barcode: p.barcode ?? '',
          videoUrl: p.video_url ?? '',
          shippingWeight: p.shipping_weight?.toString() ?? '',
          warranty: p.warranty ?? '',
          deliveryTime: p.delivery_time ?? '',
        });
        setTagsInput((p.tags ?? []).join(', '));
        if (p.specifications) {
          setSpecRows(Object.entries(p.specifications).map(([key, value]) => ({ key, value: value as string })));
        }
        const { data: imgs } = await supabase.from('product_images').select('*').eq('product_id', params.id).order('position');
        setExistingImages((imgs as ProductImage[]) ?? []);
      }
      setLoading(false);
    })();
  }, [isEdit, params.id, user]);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (imageFiles.length + files.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }
    setImageFiles((prev) => [...prev, ...files]);
  };

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imgId: string) => {
    await supabase.from('product_images').delete().eq('id', imgId);
    setExistingImages((prev) => prev.filter((i) => i.id !== imgId));
  };

  const addSpecRow = () => setSpecRows((prev) => [...prev, { key: '', value: '' }]);
  const removeSpecRow = (index: number) => setSpecRows((prev) => prev.filter((_, i) => i !== index));
  const updateSpecRow = (index: number, field: 'key' | 'value', val: string) => {
    setSpecRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: val } : r)));
  };

  const uploadImages = async (productId: string): Promise<void> => {
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const path = `products/${productId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file);
      if (uploadError) continue;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      await supabase.from('product_images').insert({
        product_id: productId,
        image_url: urlData.publicUrl,
        position: existingImages.length + i,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    if (!user) return;

    if (!form.name || !form.price || !form.categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const specifications: Record<string, string> = {};
    specRows.forEach((r) => {
      if (r.key && r.value) specifications[r.key] = r.value;
    });

    const productData = {
      vendor_id: user.id,
      category_id: form.categoryId,
      name: form.name,
      brand: form.brand || null,
      description: form.description || null,
      price: Number(form.price),
      discount_price: form.discountPrice ? Number(form.discountPrice) : null,
      stock: Number(form.stock) || 0,
      tags: tags.length > 0 ? tags : null,
      specifications: Object.keys(specifications).length > 0 ? specifications : null,
      is_featured: form.isFeatured,
      status: saveAsDraft ? 'draft' : 'pending',
      sku: form.sku || null,
      barcode: form.barcode || null,
      video_url: form.videoUrl || null,
      shipping_weight: form.shippingWeight ? Number(form.shippingWeight) : null,
      warranty: form.warranty || null,
      delivery_time: form.deliveryTime || null,
    };

    try {
      let productId = params.id;

      if (isEdit && productId) {
        const { error } = await supabase.from('products').update(productData).eq('id', productId).eq('vendor_id', user.id);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await supabase.from('products').insert(productData).select().single();
        if (error) throw new Error(error.message);
        productId = (data as any).id;
        // Update main image_url on products table
        if (imageFiles.length > 0) {
          const file = imageFiles[0];
          const path = `products/${productId}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file);
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
            await supabase.from('products').update({ image_url: urlData.publicUrl }).eq('id', productId);
            await supabase.from('product_images').insert({
              product_id: productId,
              image_url: urlData.publicUrl,
              position: 0,
            });
            // Upload remaining images
            for (let i = 1; i < imageFiles.length; i++) {
              const f = imageFiles[i];
              const p = `products/${productId}/${Date.now()}-${f.name}`;
              const { error: ue } = await supabase.storage.from('product-images').upload(p, f);
              if (!ue) {
                const { data: ud } = supabase.storage.from('product-images').getPublicUrl(p);
                await supabase.from('product_images').insert({ product_id: productId, image_url: ud.publicUrl, position: i });
              }
            }
          }
        }
      }

      if (isEdit && productId) {
        await uploadImages(productId);
      }

      toast.success(isEdit ? 'Product updated' : 'Product created');
      router.push('/seller/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container-page py-6">
        <Link href="/seller/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-2xl font-bold sm:text-3xl mb-6">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>

        <form className="space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={form.categoryId} onValueChange={(v) => set('categoryId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" placeholder="e.g. smartphone, android, 5g" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Pricing & Inventory</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (GH₵) *</Label>
                  <Input id="price" type="number" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPrice">Discount Price (GH₵)</Label>
                  <Input id="discountPrice" type="number" step="0.01" value={form.discountPrice} onChange={(e) => set('discountPrice', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input id="stock" type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Product Images (max 10)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {existingImages.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 hover:bg-accent transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload images (up to 10)</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
              </label>
              {imageFiles.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {imageFiles.map((file, i) => (
                    <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeImageFile(i)} className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Specifications</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {specRows.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Spec name (e.g. Display)" value={row.key} onChange={(e) => updateSpecRow(i, 'key', e.target.value)} />
                  <Input placeholder="Spec value (e.g. 6.4-inch)" value={row.value} onChange={(e) => updateSpecRow(i, 'value', e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSpecRow(i)} disabled={specRows.length === 1}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSpecRow}>Add Specification</Button>
            </CardContent>
          </Card>

          {/* Shipping & Additional */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Shipping & Additional</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" placeholder="e.g. SM-A525-128" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" placeholder="e.g. 8801643554321" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input id="videoUrl" type="url" placeholder="e.g. https://www.youtube.com/watch?v=..." value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="shippingWeight">Shipping Weight (kg)</Label>
                  <Input id="shippingWeight" type="number" step="0.01" min="0" placeholder="e.g. 0.5" value={form.shippingWeight} onChange={(e) => set('shippingWeight', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty">Warranty</Label>
                  <Input id="warranty" placeholder="e.g. 1 year manufacturer warranty" value={form.warranty} onChange={(e) => set('warranty', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryTime">Delivery Time</Label>
                  <Input id="deliveryTime" placeholder="e.g. 1-3 business days" value={form.deliveryTime} onChange={(e) => set('deliveryTime', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Visibility</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox id="featured" checked={form.isFeatured} onCheckedChange={(v) => set('isFeatured', v as boolean)} />
                <Label htmlFor="featured">Mark as Featured Product</Label>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="button" variant="outline" onClick={(e) => handleSubmit(e, true)} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save as Draft
            </Button>
            <Button type="submit" onClick={(e) => handleSubmit(e, false)} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isEdit ? 'Update Product' : 'Publish Product'}
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
