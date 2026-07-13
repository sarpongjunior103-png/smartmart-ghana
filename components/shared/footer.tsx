// @ts-nocheck
import Link from 'next/link';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { CONTACT } from '@/lib/contact';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container-page py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display font-bold">
                S
              </div>
              <span className="font-display text-base font-bold">
                SmartMart <span className="text-primary">Ghana</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Africa&apos;s trusted online marketplace. Buy and sell anything across the continent with confidence.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-background border hover:bg-primary hover:text-primary-foreground transition-colors">
                <Globe className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Twitter" className="flex h-9 w-9 items-center justify-center rounded-full bg-background border hover:bg-primary hover:text-primary-foreground transition-colors">
                <Globe className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full bg-background border hover:bg-primary hover:text-primary-foreground transition-colors">
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-display text-sm font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/seller/register" className="hover:text-primary transition-colors">Become a Seller</Link></li>
              <li><Link href="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display text-sm font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Returns & Refunds</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-sm font-semibold mb-3">Get in Touch</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Accra, Ghana</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> <a href={`tel:${CONTACT.phoneRaw}`} className="hover:text-primary transition-colors">{CONTACT.phone}</a></li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> <a href={`mailto:${CONTACT.email}`} className="hover:text-primary transition-colors">{CONTACT.email}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SmartMart Ghana. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-primary">Terms</Link>
            <Link href="/privacy" className="hover:text-primary">Privacy</Link>
            <Link href="/contact" className="hover:text-primary">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
