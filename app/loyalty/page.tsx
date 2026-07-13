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
import type { LoyaltyPoints, LoyaltyTransaction, LoyaltyTier } from '@/lib/types';
import { Award, Star, Gift, Loader2, TrendingUp, Zap, Crown, Medal } from 'lucide-react';
import { toast } from 'sonner';

interface LoyaltyData {
  points: LoyaltyPoints;
  transactions: LoyaltyTransaction[];
  currentTier: { id: string; label: string; minPoints: number; color: string; perk: string } | null;
  nextTier: { id: string; label: string; minPoints: number; color: string; perk: string } | null;
  rewards: readonly { points: number; label: string; value: number; type: string }[];
  tiers: readonly { id: string; label: string; minPoints: number; color: string; perk: string }[];
}

const TIER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  bronze: Medal,
  silver: Award,
  gold: Crown,
  platinum: Zap,
};

export default function LoyaltyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    (async () => {
      const res = await fetch(`/api/loyalty?userId=${user.id}`);
      const d = await res.json();
      setData(d);
      setLoading(false);
    })();
  }, [user, authLoading, router]);

  const handleRedeem = async (rewardIndex: number) => {
    if (!user || !data) return;
    setRedeeming(rewardIndex);
    try {
      const res = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, rewardIndex }),
      });
      const result = await res.json();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Redeemed: ${result.reward.label}!`);
        // Refresh data
        const res2 = await fetch(`/api/loyalty?userId=${user.id}`);
        setData(await res2.json());
      }
    } catch {
      toast.error('Failed to redeem');
    }
    setRedeeming(null);
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

  if (!data) return null;

  const { points, transactions, currentTier, nextTier, rewards, tiers } = data;
  const progressToNext = nextTier
    ? Math.min(100, ((points.total_earned - (currentTier?.minPoints ?? 0)) / (nextTier.minPoints - (currentTier?.minPoints ?? 0))) * 100)
    : 100;
  const CurrentTierIcon = TIER_ICONS[currentTier?.id ?? 'bronze'] ?? Medal;

  return (
    <>
      <Navbar />
      <main className="container-page py-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl mb-2 flex items-center gap-2">
          <Award className="h-7 w-7 text-primary" /> Loyalty Program
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Earn points on every purchase and redeem them for rewards!</p>

        {/* Points overview */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{points.points}</p>
                <p className="text-sm text-muted-foreground">Available Points</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{points.total_earned}</p>
                <p className="text-sm text-muted-foreground">Total Earned</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <CurrentTierIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold font-display capitalize">{currentTier?.label ?? 'Bronze'}</p>
                <p className="text-sm text-muted-foreground">Current Tier</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* Tier progress */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Tier Progress</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  {tiers.map((tier) => {
                    const TierIcon = TIER_ICONS[tier.id] ?? Medal;
                    const isCurrent = tier.id === currentTier?.id;
                    const isPast = (points.total_earned ?? 0) >= tier.minPoints;
                    return (
                      <div key={tier.id} className="flex flex-col items-center gap-1">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isPast ? tier.color : 'bg-muted text-muted-foreground'} ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                          <TierIcon className="h-5 w-5" />
                        </div>
                        <span className={`text-xs font-medium ${isPast ? '' : 'text-muted-foreground'}`}>{tier.label}</span>
                        <span className="text-[10px] text-muted-foreground">{tier.minPoints} pts</span>
                      </div>
                    );
                  })}
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-primary/60 h-full rounded-full transition-all" style={{ width: `${progressToNext}%` }} />
                </div>
                {nextTier && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    {nextTier.minPoints - (points.total_earned ?? 0)} points to {nextTier.label} tier!
                  </p>
                )}
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Perk: {currentTier?.perk ?? '1 point per GHS 10'}
                </p>
              </CardContent>
            </Card>

            {/* Transaction history */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Points History</CardTitle></CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No transactions yet. Start shopping to earn points!</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {transactions.map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between border-b pb-2 text-sm">
                        <div>
                          <p className="font-medium">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(txn.created_at).toLocaleDateString('en-GH')}</p>
                        </div>
                        <Badge className={txn.type === 'earn' || txn.type === 'bonus' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                          {txn.points > 0 ? '+' : ''}{txn.points}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rewards */}
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Gift className="h-5 w-5" /> Redeem Rewards</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {rewards.map((reward, i) => {
                const canRedeem = (points.points ?? 0) >= reward.points;
                return (
                  <div key={i} className={`rounded-lg border p-3 ${canRedeem ? '' : 'opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{reward.label}</p>
                        <p className="text-xs text-muted-foreground">{reward.points} points</p>
                      </div>
                      <Button
                        size="sm"
                        disabled={!canRedeem || redeeming === i}
                        onClick={() => handleRedeem(i)}
                      >
                        {redeeming === i ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Redeem'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
