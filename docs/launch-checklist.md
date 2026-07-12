# SmartMart Ghana — Launch Checklist

This checklist covers everything needed to successfully launch and maintain the SmartMart Ghana platform. Work through each section before going live.

---

## Table of Contents

1. [Environment Setup](#1-environment-setup)
2. [Database](#2-database)
3. [Payment Gateways](#3-payment-gateways)
4. [Edge Functions](#4-edge-functions)
5. [File Storage](#5-file-storage)
6. [Security](#6-security)
7. [SEO](#7-seo)
8. [Performance](#8-performance)
9. [Monitoring](#9-monitoring)
10. [Testing](#10-testing)
11. [CI/CD](#11-cicd)
12. [Content & Data](#12-content--data)
13. [Admin Setup](#13-admin-setup)
14. [Pre-Launch](#14-pre-launch)
15. [Post-Launch](#15-post-launch)
16. [Rollback Plan](#16-rollback-plan)

---

## 1. Environment Setup

- [ ] Node.js v18.x installed on all developer machines
- [ ] npm v9.x installed
- [ ] Git repository created with proper branch protection rules
- [ ] `.env.example` file created with all required variables
- [ ] `.env.local` configured for local development
- [ ] Production environment variables configured in hosting platform
- [ ] Staging environment variables configured (if applicable)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_URL` set (server-side)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server-side, never exposed to client)
- [ ] `SUPABASE_ANON_KEY` set (server-side)
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] `NEXT_PUBLIC_APP_NAME` set to "SmartMart Ghana"
- [ ] `NODE_ENV` set to "production" for production builds
- [ ] Environment variables validated on application startup

---

## 2. Database

- [ ] Supabase project created and accessible
- [ ] All migrations applied in correct order
- [ ] Verify all tables exist:
  - [ ] `profiles`
  - [ ] `categories`
  - [ ] `products`
  - [ ] `product_images`
  - [ ] `orders`
  - [ ] `order_items`
  - [ ] `payments`
  - [ ] `transactions`
  - [ ] `shipping`
  - [ ] `vendor_profiles`
  - [ ] `stores`
  - [ ] `inventory_logs`
  - [ ] `reviews`
  - [ ] `wishlist`
  - [ ] `chat_conversations`
  - [ ] `chat_messages`
  - [ ] `loyalty_points`
  - [ ] `referrals`
  - [ ] `activity_logs`
  - [ ] `platform_settings`
  - [ ] `support_tickets`
- [ ] All foreign key relationships verified
- [ ] All indexes created for frequently queried columns
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] RLS policies tested:
  - [ ] Customers can only access their own data
  - [ ] Vendors can only access their own products and related orders
  - [ ] Admins have full access
  - [ ] Public can view active products and approved stores
- [ ] Database triggers configured (e.g., auto-create profile on signup)
- [ ] Database functions tested
- [ ] Seed data inserted (categories, platform settings)
- [ ] Database backup verified and working
- [ ] Connection pool settings optimized

---

## 3. Payment Gateways

### Paystack
- [ ] Paystack account created and verified
- [ ] API keys obtained (test and live)
- [ ] `PAYSTACK_SECRET_KEY` set in environment
- [ ] `PAYSTACK_PUBLIC_KEY` set in environment
- [ ] Webhook URL configured in Paystack dashboard
- [ ] Webhook events subscribed: `charge.success`, `charge.failed`, `refund.processed`
- [ ] Test transaction completed successfully
- [ ] Live mode enabled (when ready for production)

### Stripe
- [ ] Stripe account created and verified
- [ ] API keys obtained (test and live)
- [ ] `STRIPE_SECRET_KEY` set in environment
- [ ] `STRIPE_WEBHOOK_SECRET` set in environment
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` set in environment
- [ ] Webhook endpoint configured in Stripe dashboard
- [ ] Webhook events subscribed: `checkout.session.completed`, `charge.refunded`, `checkout.session.expired`
- [ ] Test checkout session completed successfully
- [ ] Live mode enabled (when ready for production)

### Flutterwave
- [ ] Flutterwave account created and verified
- [ ] API keys obtained (test and live)
- [ ] `FLUTTERWAVE_SECRET_KEY` set in environment
- [ ] `FLUTTERWAVE_PUBLIC_KEY` set in environment
- [ ] `FLUTTERWAVE_ENCRYPTION_KEY` set in environment
- [ ] Webhook URL configured in Flutterwave dashboard
- [ ] Webhook events subscribed: `charge.completed`, `refund.completed`
- [ ] Test transaction completed successfully
- [ ] Live mode enabled (when ready for production)

### Hubtel
- [ ] Hubtel account created and verified
- [ ] API credentials obtained (test and live)
- [ ] `HUBTEL_CLIENT_ID` set in environment
- [ ] `HUBTEL_CLIENT_SECRET` set in environment
- [ ] Webhook URL configured in Hubtel dashboard
- [ ] Test transaction completed successfully
- [ ] Live mode enabled (when ready for production)

### General Payment Checks
- [ ] Payment flow tested end-to-end (checkout → payment → webhook → order confirmation)
- [ ] Refund flow tested
- [ ] Failed payment handling tested
- [ ] Payment receipts/confirmations verified
- [ ] Currency conversion working (if multi-currency)
- [ ] Minimum/maximum order amounts enforced

---

## 4. Edge Functions

- [ ] All edge functions deployed to Supabase:
  - [ ] `paystack-webhook` deployed
  - [ ] `stripe-webhook` deployed
  - [ ] `flutterwave-webhook` deployed
  - [ ] `hubtel-webhook` deployed
  - [ ] `send-email` deployed
- [ ] JWT verification disabled for webhook functions (they receive external requests)
- [ ] Edge function secrets configured:
  - [ ] `SUPABASE_URL` set
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` set
  - [ ] `EMAIL_API_KEY` set
  - [ ] `EMAIL_FROM` set
  - [ ] `PAYSTACK_SECRET_KEY` set (for signature verification)
  - [ ] `STRIPE_WEBHOOK_SECRET` set (for signature verification)
  - [ ] `FLUTTERWAVE_SECRET_KEY` set (for verification)
  - [ ] `HUBTEL_CLIENT_SECRET` set (for verification)
- [ ] All edge functions tested with sample payloads
- [ ] Edge function logs checked for errors
- [ ] CORS headers properly configured on all functions
- [ ] Error handling verified (malformed requests, missing fields)

---

## 5. File Storage

### Cloudinary
- [ ] Cloudinary account created
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` set
- [ ] `CLOUDINARY_API_KEY` set
- [ ] `CLOUDINARY_API_SECRET` set
- [ ] Upload presets configured:
  - [ ] `product_images` preset
  - [ ] `vendor_logos` preset
  - [ ] `user_avatars` preset
  - [ ] `category_images` preset
- [ ] Folder structure created (products/, vendors/logos/, users/avatars/, categories/)
- [ ] Image upload tested (product, avatar, logo)
- [ ] Image optimization verified (auto format, auto quality)
- [ ] Image transformations working (thumbnail, full-size, avatar)
- [ ] CDN delivery verified (images load quickly)
- [ ] Bandwidth and storage limits reviewed

---

## 6. Security

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the client
- [ ] All API routes validate authentication where required
- [ ] RLS policies tested with different user roles
- [ ] Input validation on all forms and API endpoints
- [ ] XSS protection (Next.js built-in + input sanitization)
- [ ] CSRF protection on state-changing requests
- [ ] SQL injection prevention (parameterized queries via Supabase client)
- [ ] Rate limiting configured on API endpoints
- [ ] HTTPS enforced (SSL/TLS certificate active)
- [ ] Security headers configured:
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-XSS-Protection: 1; mode=block`
  - [ ] `Strict-Transport-Security`
  - [ ] `Content-Security-Policy`
- [ ] Password requirements enforced (min 8 characters)
- [ ] Email verification required for new accounts
- [ ] Two-factor authentication available for admins
- [ ] Session management configured (timeout, refresh tokens)
- [ ] Admin IP whitelist configured (if applicable)
- [ ] Sensitive data encrypted at rest
- [ ] Payment data never stored on our servers (handled by gateways)
- [ ] `npm audit` passes with no high/critical vulnerabilities
- [ ] Dependencies up to date

---

## 7. SEO

- [ ] `sitemap.xml` generated and accessible at `/sitemap.xml`
- [ ] `robots.txt` configured at `/robots.txt`
- [ ] Structured data (JSON-LD) implemented:
  - [ ] `WebSite` schema on homepage
  - [ ] `Organization` schema on about/contact pages
  - [ ] `Product` schema on product pages
  - [ ] `BreadcrumbList` schema on category/product pages
- [ ] Meta tags configured on all pages:
  - [ ] Title tags (unique per page, max 60 chars)
  - [ ] Meta descriptions (unique per page, max 160 chars)
  - [ ] Open Graph tags (og:title, og:description, og:image)
  - [ ] Twitter Card tags
- [ ] Canonical URLs set on all pages
- [ ] Image alt tags on all images
- [ ] Semantic HTML used (h1, h2, h3 hierarchy)
- [ ] Mobile-friendly (responsive design verified)
- [ ] Page load speed optimized (Core Web Vitals pass)
- [ ] `next-sitemap` or equivalent configured
- [ ] Google Search Console verified
- [ ] Google Analytics configured (if applicable)

---

## 8. Performance

- [ ] Images optimized via Cloudinary (auto format, auto quality)
- [ ] Next.js Image component used for product images
- [ ] Code splitting and lazy loading implemented
- [ ] Database queries optimized (proper indexes)
- [ ] API responses cached where appropriate
- [ ] Static pages pre-rendered (SSG)
- [ ] Dynamic pages use ISR (Incremental Static Regeneration) where possible
- [ ] Bundle size analyzed and minimized
- [ ] Fonts optimized (next/font)
- [ ] CSS minimized
- [ ] JavaScript minified
- [ ] Gzip/Brotli compression enabled
- [ ] CDN configured for static assets
- [ ] Core Web Vitals checked:
  - [ ] LCP (Largest Contentful Paint) < 2.5s
  - [ ] FID (First Input Delay) < 100ms
  - [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] Lighthouse audit score > 90 (performance)

---

## 9. Monitoring

- [ ] Health check endpoint (`/api/health`) working
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom, or similar)
- [ ] Error tracking configured (Sentry or similar)
- [ ] Application logs accessible
- [ ] Supabase database monitoring reviewed
- [ ] Edge function logs monitored
- [ ] Cloudinary usage monitored (bandwidth, storage)
- [ ] Payment gateway dashboards monitored
- [ ] Email delivery monitored (Resend dashboard)
- [ ] Alerting configured for critical errors
- [ ] Performance monitoring (Vercel Analytics or similar)

---

## 10. Testing

- [ ] Unit tests written and passing:
  - [ ] Search/spell correction tests
  - [ ] SEO structured data tests
  - [ ] Cloudinary URL helper tests
  - [ ] Health check API tests
- [ ] Integration tests written and passing:
  - [ ] Auth integration tests (sign up, sign in, sign out)
  - [ ] Database connectivity tests (all tables)
  - [ ] Checkout/payment integration tests (orders, payments, transactions, shipping)
  - [ ] Admin/vendor integration tests (vendor profiles, stores, activity logs, inventory, loyalty, referrals, chat)
- [ ] End-to-end tests passing (if applicable)
- [ ] Test coverage > 70%
- [ ] `npm run test:unit` passes
- [ ] `npm run test:integration` passes
- [ ] Manual testing completed:
  - [ ] User registration and login
  - [ ] Product browsing and search
  - [ ] Cart and checkout flow
  - [ ] Payment processing (test mode)
  - [ ] Order tracking
  - [ ] Vendor registration and product listing
  - [ ] Admin dashboard access
  - [ ] Email sending (all templates)
  - [ ] Live chat functionality

---

## 11. CI/CD

- [ ] GitHub Actions workflow configured (`.github/workflows/ci-cd.yml`)
- [ ] Lint job runs ESLint and TypeScript checks
- [ ] Unit test job runs on every push and PR
- [ ] Integration test job runs (requires lint + unit to pass)
- [ ] Build job runs `next build` successfully
- [ ] Security audit job runs `npm audit`
- [ ] Deploy job configured for `main` branch only
- [ ] Deploy job requires build + integration + security-audit to pass
- [ ] Environment secrets configured in GitHub
- [ ] Branch protection rules set (require PR review, status checks)
- [ ] CI pipeline runs in < 10 minutes
- [ ] Deployment is automated on merge to main

---

## 12. Content & Data

- [ ] Default categories created (Electronics, Fashion, Home & Living, Health & Beauty, Phones & Tablets)
- [ ] Platform settings seeded (general, payment, shipping, tax, notification, security)
- [ ] Homepage content written and reviewed
- [ ] About page content written
- [ ] Terms of Service page created
- [ ] Privacy Policy page created
- [ ] Return/Refund policy page created
- [ ] Shipping policy page created
- [ ] FAQ page created
- [ ] Contact page created
- [ ] Help center articles written
- [ ] Vendor onboarding guide available
- [ ] Product descriptions reviewed for accuracy
- [ ] All images optimized and uploaded
- [ ] No placeholder content remaining

---

## 13. Admin Setup

- [ ] Admin account created with `admin` role
- [ ] Admin email verified
- [ ] Two-factor authentication enabled for admin account
- [ ] Platform settings configured:
  - [ ] General settings (site name, support email, phone)
  - [ ] Payment settings (enabled gateways, default gateway)
  - [ ] Shipping settings (carriers, rates, zones)
  - [ ] Tax settings (VAT rate, NHIL, GETFL)
  - [ ] Notification settings (email, SMS preferences)
  - [ ] Security settings (2FA, session timeout, rate limits)
- [ ] Admin dashboard accessible
- [ ] User management tested
- [ ] Product management tested
- [ ] Order management tested
- [ ] Analytics reviewed
- [ | Audit logs verified
- [ ] Support ticket system tested

---

## 14. Pre-Launch

- [ ] All checklist items above completed
- [ ] Full end-to-end test of the platform completed
- [ ] Payment flow tested in sandbox/live mode
- [ ] Email delivery tested for all 9 templates
- [ ] All edge functions tested with real webhook payloads
- [ ] Database backup taken before launch
- [ ] DNS configured and pointing to the application
- [ ] SSL certificate active and valid
- [ ] CDN configured
- [ ] Custom domain verified
- [ ] No console errors in browser
- [ ] No critical bugs outstanding
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Mobile experience verified (iOS and Android)
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility check (WCAG 2.1 AA compliance)
- [ ] Legal pages reviewed by legal counsel
- [ ] Team briefed on launch plan
- [ ] Support team ready for customer inquiries
- [ ] Rollback plan documented and tested

---

## 15. Post-Launch

- [ ] Health check endpoint returning healthy status
- [ ] Monitor error rates for first 24 hours
- [ ] Monitor payment success rates
- [ ] Monitor email delivery rates
- [ ] Check edge function logs for errors
- [ ] Verify webhooks are receiving events
- [ ] Monitor database performance
- [ ] Monitor Cloudinary bandwidth usage
- [ ] Check for any failed payments
- [ ] Test a real purchase end-to-end
- [ ] Verify Google Search Console indexing
- [ ] Submit sitemap to Google
- [ ] Monitor Core Web Vitals
- [ ] Collect initial user feedback
- [ ] Schedule post-launch review meeting
- [ ] Document any issues and create action items
- [ ] Set up regular backup schedule
- [ ] Configure ongoing monitoring alerts
- [ ] Plan first week status check

---

## 16. Rollback Plan

In case of critical issues after launch, follow this rollback plan:

### Quick Rollback (Deployment Issues)

1. **Revert to previous deployment** in hosting platform (Vercel/Netlify)
   - Vercel: Go to Deployments → select previous deployment → "Promote to Production"
   - Netlify: Go to Deploys → select previous deploy → "Publish deploy"
2. **Verify the previous version is live** by checking the health endpoint
3. **Notify the team** of the rollback via communication channel
4. **Investigate the issue** in a staging environment
5. **Fix and re-deploy** once the issue is resolved

### Database Rollback (Migration Issues)

1. **Stop the application** to prevent further writes
2. **Restore database from backup**:
   ```bash
   pg_restore -d "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" \
     backup_YYYYMMDD.dump
   ```
3. **Verify data integrity** by running test queries
4. **Re-deploy the previous application version** (compatible with old schema)
5. **Investigate the migration issue** in staging
6. **Fix the migration** and re-apply when ready

### Edge Function Rollback

1. **Identify the problematic edge function** from logs
2. **Redeploy the previous version** via Supabase CLI:
   ```bash
   supabase functions deploy [function-name] --no-verify-jwt
   ```
3. **Verify the function is working** with a test request
4. **Check webhook delivery** is not interrupted

### Payment Gateway Rollback

1. **Switch payment gateway to test mode** (if production payments are failing)
2. **Pause new orders** via platform settings (maintenance mode)
3. **Investigate the payment issue**
4. **Fix and re-enable** live payments
5. **Process any pending payments** manually if needed

### Communication Plan

- **Internal**: Notify the engineering team immediately via Slack/Teams
- **External**: Post a status update on the website if there's downtime
- **Customers**: Email affected customers if their orders/payments were impacted
- **Support**: Brief the support team on the issue and expected resolution time

### Rollback Decision Criteria

Initiate a rollback if:
- Error rate exceeds 5% of requests
- Payment success rate drops below 95%
- Critical functionality is broken (checkout, login, search)
- Database integrity is compromised
- Security vulnerability is discovered
