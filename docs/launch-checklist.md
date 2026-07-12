# Launch Checklist

This checklist ensures SmartMart is fully ready for production launch. Complete every section before going live.

---

## Table of Contents

1. [Infrastructure & Environment](#1-infrastructure--environment)
2. [Database & Migrations](#2-database--migrations)
3. [Authentication & Security](#3-authentication--security)
4. [Payment Integration](#4-payment-integration)
5. [Email Service](#5-email-service)
6. [Image Management](#6-image-management)
7. [Frontend & UI](#7-frontend--ui)
8. [Edge Functions](#8-edge-functions)
9. [Search & SEO](#9-search--seo)
10. [Testing](#10-testing)
11. [CI/CD Pipeline](#11-cicd-pipeline)
12. [Monitoring & Analytics](#12-monitoring--analytics)
13. [Documentation](#13-documentation)
14. [Pre-Launch Validation](#14-pre-launch-validation)
15. [Go-Live & Post-Launch](#15-go-live--post-launch)

---

## 1. Infrastructure & Environment

- [ ] Supabase project created and configured
- [ ] Vercel project created and linked to repository
- [ ] Cloudinary account created and configured
- [ ] Resend account created and verified
- [ ] Payment gateway accounts created (Paystack, Stripe, Flutterwave, Hubtel)
- [ ] All environment variables set in Vercel:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - [ ] `NEXT_PUBLIC_CLOUDINARY_API_KEY`
  - [ ] `CLOUDINARY_API_SECRET`
  - [ ] `RESEND_API_KEY`
  - [ ] `EMAIL_FROM` set to `smartmart304@gmail.com`
  - [ ] `PAYSTACK_SECRET_KEY`
  - [ ] `PAYSTACK_PUBLIC_KEY`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `FLUTTERWAVE_SECRET_KEY`
  - [ ] `FLUTTERWAVE_PUBLIC_KEY`
  - [ ] `HUBTEL_CLIENT_ID`
  - [ ] `HUBTEL_CLIENT_SECRET`
- [ ] Custom domain configured in Vercel
- [ ] DNS records configured (A record, CNAME, MX, TXT)
- [ ] SSL certificate active and verified

---

## 2. Database & Migrations

- [ ] All migrations applied successfully
- [ ] All tables created and accessible
- [ ] RLS enabled on all tables
- [ ] RLS policies tested (unauthenticated access blocked)
- [ ] RLS policies tested (authenticated users see only their data)
- [ ] Foreign key relationships verified
- [ ] Indexes created on frequently queried columns
- [ ] Seed data loaded (categories, admin user, default settings)
- [ ] Database backup configured
- [ ] Connection pool settings optimized

---

## 3. Authentication & Security

- [ ] Email/password authentication working
- [ ] Email verification flow tested
- [ ] Password reset flow tested
- [ ] Session management working (login, logout, session refresh)
- [ ] Two-Factor Authentication (2FA) configured for admin accounts
- [ ] IP whitelist configured (if enabled)
- [ ] Password policies enforced (minimum length, complexity)
- [ ] Session timeout configured
- [ ] Admin role assigned to authorized users only
- [ ] Service role key kept secure (never exposed client-side)
- [ ] No sensitive keys in client-side code
- [ ] CORS headers configured correctly on all edge functions

---

## 4. Payment Integration

### Paystack
- [ ] Paystack public and secret keys configured
- [ ] Webhook URL set in Paystack dashboard
- [ ] Webhook signature verification tested
- [ ] Test payment processed successfully
- [ ] Test refund processed successfully
- [ ] Webhook receives and processes `charge.success` events
- [ ] Webhook receives and processes `charge.failed` events

### Stripe
- [ ] Stripe public and secret keys configured
- [ ] Webhook URL set in Stripe dashboard
- [ ] Webhook events registered: `checkout.session.completed`, `charge.refunded`, `checkout.session.expired`
- [ ] Webhook signing secret configured
- [ ] Test checkout session completed successfully
- [ ] Test refund processed successfully
- [ ] Test expired session handled correctly

### Flutterwave
- [ ] Flutterwave public and secret keys configured
- [ ] Webhook URL set in Flutterwave dashboard
- [ ] Webhook hash configured
- [ ] Test payment processed successfully
- [ ] Test refund processed successfully
- [ ] `charge.completed` event handled
- [ ] `refund.completed` event handled

### Hubtel
- [ ] Hubtel client ID and secret configured
- [ ] Webhook URL set in Hubtel dashboard
- [ ] Test payment (Success status) processed successfully
- [ ] Test payment (Failed status) handled correctly

### General Payment
- [ ] Order status updates correctly after payment
- [ ] Payment status updates correctly in `payments` table
- [ ] Transaction status updates correctly in `transactions` table
- [ ] Activity log entries created for all payment events
- [ ] Failed payments cancel orders correctly
- [ ] Refunds update order status to `refunded`

---

## 5. Email Service

- [ ] Resend API key configured in Edge Function secrets
- [ ] `EMAIL_FROM` set to `smartmart304@gmail.com`
- [ ] Sending domain verified in Resend (if custom domain)
- [ ] Test all 9 email templates:
  - [ ] `welcome` — sent on new user registration
  - [ ] `email_verification` — sent on email verification
  - [ ] `password_reset` — sent on password reset request
  - [ ] `order_confirmation` — sent on order confirmation
  - [ ] `order_shipped` — sent on order shipment
  - [ ] `order_delivered` — sent on order delivery
  - [ ] `refund_notification` — sent on refund processing
  - [ ] `vendor_approval` — sent on vendor approval
  - [ ] `vendor_rejection` — sent on vendor rejection
- [ ] All emails include contact info in footer:
  - [ ] Phone: +233 55 162 1261
  - [ ] Email: smartmart304@gmail.com
- [ ] Email delivery confirmed (check spam folder)
- [ ] Email rendering verified on mobile and desktop

---

## 6. Image Management

- [ ] Cloudinary cloud name configured
- [ ] Cloudinary API key and secret configured
- [ ] Upload presets created for:
  - [ ] Product images
  - [ ] User avatars
  - [ ] Store logos
  - [ ] Store banners
- [ ] Image optimization working (auto format, auto quality)
- [ ] Thumbnail generation working
- [ ] Full-size image delivery working
- [ ] Avatar URL generation working
- [ ] Test image upload and retrieval

---

## 7. Frontend & UI

- [ ] Home page loads correctly
- [ ] Product listing pages load correctly
- [ ] Product detail pages load correctly
- [ ] Cart page functional (add, remove, update quantity)
- [ ] Checkout flow works end-to-end
- [ ] User registration flow works
- [ ] User login flow works
- [ ] User dashboard loads correctly
- [ ] Order history page loads correctly
- [ ] Wishlist page functional
- [ ] Reviews and ratings functional
- [ ] Live chat widget functional
- [ ] Admin panel loads correctly
- [ ] Admin settings page — all 6 tabs functional:
  - [ ] General settings
  - [ ] Payment settings
  - [ ] Shipping settings
  - [ ] Tax settings
  - [ ] Notification settings
  - [ ] Security settings (including danger zone / maintenance mode)
- [ ] Vendor dashboard loads correctly
- [ ] Mobile responsiveness verified on all pages
- [ ] No console errors in production build
- [ ] No broken links

---

## 8. Edge Functions

- [ ] `paystack-webhook` deployed and tested
- [ ] `stripe-webhook` deployed and tested
- [ ] `flutterwave-webhook` deployed and tested
- [ ] `hubtel-webhook` deployed and tested
- [ ] `send-email` deployed and tested
- [ ] All Edge Function secrets configured
- [ ] CORS headers correct on all functions
- [ ] Error responses return appropriate status codes
- [ ] Activity logging working in all webhook handlers

---

## 9. Search & SEO

- [ ] Search API returns results correctly
- [ ] Spell correction working (e.g., "fone" → "phone", "laptob" → "laptop")
- [ ] Search filters working (category, price, rating)
- [ ] Search sorting working (relevance, price, newest, rating)
- [ ] Pagination working
- [ ] Website schema (structured data) valid
- [ ] Organization schema includes correct contact info:
  - [ ] Email: smartmart304@gmail.com
  - [ ] Phone: +233551621261
- [ ] Product schema valid
- [ ] Breadcrumb schema valid
- [ ] Sitemap.xml generated and accessible
- [ ] robots.txt configured correctly
- [ ] Meta tags present on all pages
- [ ] Open Graph tags configured for social sharing

---

## 10. Testing

- [ ] Unit tests passing (`npm run test:unit`)
  - [ ] Search/spell-correct tests passing
  - [ ] SEO/structured-data tests passing
  - [ ] Cloudinary tests passing
  - [ ] Health check tests passing
- [ ] Integration tests passing (`npm run test:integration`)
  - [ ] Auth integration tests passing
  - [ ] Database connectivity tests passing
  - [ ] Checkout (payments, orders, shipping, transactions) tests passing
  - [ ] Admin/vendor (profiles, stores, activity logs, inventory logs, loyalty points, referrals, chat) tests passing
- [ ] Test coverage meets minimum threshold
- [ ] No skipped or pending tests
- [ ] E2E tests passing (if configured)

---

## 11. CI/CD Pipeline

- [ ] GitHub Actions workflow configured (`.github/workflows/ci-cd.yml`)
- [ ] Lint job passing (ESLint + Prettier)
- [ ] Unit tests job passing
- [ ] Integration tests job passing
- [ ] Build job passing
- [ ] Security audit job passing (npm audit + CodeQL)
- [ ] Deploy job configured for `main` branch
- [ ] All GitHub secrets configured
- [ ] Pipeline runs successfully on a test push
- [ ] Rollback procedure documented and tested

---

## 12. Monitoring & Analytics

- [ ] Supabase logs accessible and monitored
- [ ] Vercel analytics enabled
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Uptime monitoring configured
- [ ] Alert notifications set up for:
  - [ ] Deployment failures
  - [ ] High error rates
  - [ ] Database connection issues
  - [ ] Payment webhook failures
- [ ] Analytics tracking configured (Google Analytics or equivalent)
- [ ] Performance monitoring (Core Web Vitals)

---

## 13. Documentation

- [ ] README.md up to date
- [ ] Deployment guide complete and accurate
- [ ] Admin guide complete
- [ ] Vendor guide complete
- [ ] Customer guide complete
- [ ] API reference complete
- [ ] Launch checklist complete (this document)
- [ ] All documentation includes correct contact info:
  - [ ] Phone: +233 55 162 1261
  - [ ] Email: smartmart304@gmail.com
- [ ] Environment setup instructions clear
- [ ] Troubleshooting guide available

---

## 14. Pre-Launch Validation

- [ ] Full end-to-end test: register → search → add to cart → checkout → pay → order confirmed
- [ ] Test each payment gateway with a real transaction
- [ ] Test order fulfillment flow: confirmed → processing → shipped → delivered
- [ ] Test refund flow end-to-end
- [ ] Test vendor registration and approval flow
- [ ] Test vendor product creation and management
- [ ] Test admin settings changes (all 6 tabs)
- [ ] Test maintenance mode (enable and verify storefront is offline)
- [ ] Test email notifications for all events
- [ ] Test live chat between customer and vendor
- [ ] Test loyalty points earning and redemption
- [ ] Test referral program
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS, Android)
- [ ] Performance test (page load < 3 seconds)
- [ ] Security scan completed (no vulnerabilities)
- [ ] Accessibility check (WCAG compliance)

---

## 15. Go-Live & Post-Launch

- [ ] Final deployment to production
- [ ] DNS propagated (check with `dig` or online tools)
- [ ] SSL certificate active
- [ ] Smoke test on production URL
- [ ] Monitor error logs for first 24 hours
- [ ] Monitor payment webhook delivery
- [ ] Monitor email delivery
- [ ] Check analytics are tracking
- [ ] Announce launch to team
- [ ] Monitor customer support channels
- [ ] Schedule post-launch review (1 week after launch)
- [ ] Document any issues encountered and resolutions
- [ ] Set up regular backup verification
- [ ] Configure periodic security audits

---

## Support

If you encounter any issues during the launch process, please contact our support team:

- **Phone:** +233 55 162 1261
- **Email:** smartmart304@gmail.com

We're here to ensure a smooth and successful launch.
