// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Navbar } from '@/components/shared/navbar';
import { ArrowLeft, Eye, EyeOff, Loader2, Upload, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { COUNTRIES, BUSINESS_CATEGORIES } from '@/lib/constants';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function SellerRegisterPage() {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    businessName: '', ownerName: '', businessEmail: '', phone: '',
    country: 'Ghana', businessAddress: '', businessCategory: BUSINESS_CATEGORIES[0],
    taxNumber: '', password: '', confirmPassword: '', acceptPolicy: false,
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from('vendor-assets').upload(path, file);
    if (error) return null;
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!form.acceptPolicy) {
      toast.error('Please accept the seller policy');
      return;
    }
    setLoading(true);

    let logoUrl: string | null = null;
    let idUrl: string | null = null;
    if (logoFile) {
      logoUrl = await uploadFile(logoFile, `logos/${Date.now()}-${logoFile.name}`);
    }
    if (idFile) {
      idUrl = await uploadFile(idFile, `ids/${Date.now()}-${idFile.name}`);
    }

    const { error } = await signUp(form.businessEmail, form.password, {
      role: 'vendor',
      first_name: form.ownerName,
      phone: form.phone,
      country: form.country,
      business_name: form.businessName,
      business_email: form.businessEmail,
      business_address: form.businessAddress,
      business_category: form.businessCategory,
      tax_number: form.taxNumber,
      logo_url: logoUrl,
      id_url: idUrl,
    });

    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    setSubmitted(true);
    toast.success('Application submitted successfully!');
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="container-page flex min-h-[70vh] items-center justify-center py-12">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Application Submitted Successfully</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2 mt-2">
                <Clock className="h-4 w-4 text-secondary" />
                Waiting for Admin Approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Thank you for applying to sell on SmartMart Ghana. Our admin team will review your application within 1-2 business days. You&apos;ll receive an email once your store is approved.
              </p>
              <Button className="w-full" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container-page py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-display">Become a Seller</CardTitle>
              <CardDescription>Apply to start selling on SmartMart Ghana. Our team will review your application.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input id="businessName" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input id="ownerName" value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Business Email</Label>
                    <Input id="businessEmail" type="email" value={form.businessEmail} onChange={(e) => set('businessEmail', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+233 ..." value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <select id="country" value={form.country} onChange={(e) => set('country', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessCategory">Business Category</Label>
                    <select id="businessCategory" value={form.businessCategory} onChange={(e) => set('businessCategory', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Input id="businessAddress" value={form.businessAddress} onChange={(e) => set('businessAddress', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">Tax Number (Optional)</Label>
                  <Input id="taxNumber" value={form.taxNumber} onChange={(e) => set('taxNumber', e.target.value)} />
                </div>

                {/* File uploads */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Business Logo Upload</Label>
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 hover:bg-accent transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{logoFile ? logoFile.name : 'Click to upload logo'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label>Government ID Upload</Label>
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 hover:bg-accent transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{idFile ? idFile.name : 'Click to upload ID'}</span>
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setIdFile(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} required />
                      <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required />
                      <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="policy" checked={form.acceptPolicy} onCheckedChange={(v) => set('acceptPolicy', v as boolean)} />
                  <Label htmlFor="policy" className="text-sm font-normal leading-snug">
                    I agree to the <Link href="/seller-policy" className="text-primary hover:underline">Seller Policy</Link> and terms of service for vendors on SmartMart Ghana
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
