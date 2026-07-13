// @ts-nocheck
'use client'

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ShoppingCart, Bell, User, ChevronDown, LogOut, Store, Search, Gift, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useLocale } from '@/lib/locale-context';
import { AFRICAN_COUNTRIES, LANGUAGES } from '@/lib/constants';
import { Globe, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/categories', label: 'Categories' },
  { href: '/seller/register', label: 'Become a Seller' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile, signOut } = useAuth();
  const { count } = useCart();
  const { countryCode, language, setCountry, setLanguage, countryConfig } = useLocale();
  const [countryOpen, setCountryOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setCountryOpen(false);
    setLangOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-background/95 shadow-md backdrop-blur-md'
          : 'bg-background/80 backdrop-blur-sm'
      )}
    >
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-display font-bold text-lg shadow-sm">
              S
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              SmartMart <span className="text-primary">Ghana</span>
            </span>
          </Link>

          {/* Search bar (desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-primary'
                    : 'text-foreground/70 hover:text-foreground hover:bg-accent'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Country selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => { setCountryOpen(!countryOpen); setLangOpen(false); }}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                <span className="text-lg">{countryConfig.flag}</span>
                <span className="text-xs font-medium">{countryConfig.code}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {countryOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-lg border bg-popover shadow-lg z-50 max-h-64 overflow-y-auto">
                  {AFRICAN_COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCountry(c.code); setCountryOpen(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span className="flex-1 text-left">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.currency}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Language selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => { setLangOpen(!langOpen); setCountryOpen(false); }}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                <Languages className="h-4 w-4" />
                <span className="text-xs font-medium uppercase">{language}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1 w-36 rounded-lg border bg-popover shadow-lg z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      <span className="text-lg">{l.flag}</span>
                      <span className="flex-1 text-left">{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-secondary" />
            </Button>
            <Button variant="ghost" size="icon" className="relative" aria-label="Shopping cart" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-secondary-foreground">
                    {count}
                  </span>
                )}
              </Link>
            </Button>

            {user ? (
              <div className="relative hidden sm:block">
                <Button
                  variant="ghost"
                  className="gap-2"
                  onClick={() => setProfileOpen((p) => !p)}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {profile?.first_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase()}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-popover p-2 shadow-lg">
                    <div className="px-3 py-2 border-b mb-1">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                    </div>
                    {profile?.role === 'admin' && (
                      <Link href="/admin/dashboard" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                        Admin Dashboard
                      </Link>
                    )}
                    {profile?.role === 'vendor' && (
                      <Link href="/seller/dashboard" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                        Seller Dashboard
                      </Link>
                    )}
                    <Link href="/dashboard" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                      My Dashboard
                    </Link>
                    <Link href="/referral" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                      Referral Program
                    </Link>
                    <Link href="/loyalty" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                      Loyalty Program
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}

            {/* Mobile toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="container-page py-4">
            <form onSubmit={handleSearch} className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </form>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-2.5 text-sm font-medium',
                  pathname === link.href ? 'bg-accent text-primary' : 'hover:bg-accent'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t mt-2 pt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-accent">
                    <User className="h-4 w-4" /> My Dashboard
                  </Link>
                  <Link href="/referral" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-accent">
                    <Gift className="h-4 w-4" /> Referral Program
                  </Link>
                  <Link href="/loyalty" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-accent">
                    <Award className="h-4 w-4" /> Loyalty Program
                  </Link>
                  {profile?.role === 'vendor' && (
                    <Link href="/seller/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-accent">
                      <Store className="h-4 w-4" /> Seller Dashboard
                    </Link>
                  )}
                  {profile?.role === 'admin' && (
                    <Link href="/admin/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-accent">
                      <Store className="h-4 w-4" /> Admin Dashboard
                    </Link>
                  )}
                  <button onClick={() => signOut()} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 text-left">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Register</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
          </div>
        </div>
      )}
    </header>
  );
}
