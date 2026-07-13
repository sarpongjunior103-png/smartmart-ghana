// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { formatPrice, REFERRAL_REWARD_REFERRER, REFERRAL_REWARD_REFERRED } from '@/lib/constants';
import type { Referral } from '@/lib/types';
import { Gift, Users, DollarSign, Copy, Check, Share2, Loader2, TrendingUp, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    (async () => {
      const res = await fetch(`/api/referrals?userId=${user.id}`);
      const data = await res.json();
      if (data.referralCode) setReferralCode(data.referralCode);
      if (data.referrals) setReferrals(data.referrals);
      if (data.stats) setStats(data.stats);
      setLoading(false);
    })();
  }, [user, authLoading, router]);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`;

  const shareSocial = (platform: string) => {
    const text = encodeURIComponent('Join me on SmartMart Ghana and get GHS 5 off your first order!');
    const url = encodeURIComponent(shareLink);
    const links: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    };
    if (links[platform]) window.open(links[platform], '_blank');
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="container-page flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container-page py-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl mb-2 flex items-center gap-2">
          <Gift className="h-7 w-7 text-primary" /> Referral Program
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Invite friends and earn rewards together!</p>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stats.total}</p>
                <p className="text-sm text-muted-foreground">People Invited</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{formatPrice(stats.totalEarnings)}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed Referrals</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Referral list */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Your Referrals</CardTitle></CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="mx-auto h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm">No referrals yet. Share your code to start earning!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referrals.map((r) => (
                    <div key={r.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="text-sm font-medium font-mono">{r.referral_code}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en-GH')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{formatPrice(Number(r.referrer_reward))}</span>
                        <Badge className={
                          r.status === 'completed' ? 'bg-green-100 text-green-800' :
                          r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          r.status === 'rewarded' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>{r.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share card */}
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Share2 className="h-5 w-5" /> Share & Earn</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="font-display text-2xl font-bold text-primary tracking-wider">{referralCode}</p>
                  <button onClick={copyCode} className="p-1 rounded hover:bg-accent">
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">How it works:</p>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                  <span>Share your referral code with friends</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                  <span>They sign up and get {formatPrice(REFERRAL_REWARD_REFERRED)} off their first order</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                  <span>You earn {formatPrice(REFERRAL_REWARD_REFERRER)} + 100 loyalty points</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Share via:</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => shareSocial('whatsapp')} className="flex-1">
                    WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareSocial('facebook')} className="flex-1">
                    Facebook
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareSocial('twitter')} className="flex-1">
                    Twitter
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Your referral link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 rounded-lg border bg-muted px-2 py-1.5 text-xs"
                  />
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('Link copied!'); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
