# SmartMart Ghana — Deployment Guide

This guide covers the complete deployment process for the SmartMart Ghana platform, from prerequisites to post-deployment monitoring.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Variables](#2-environment-variables)
3. [Database Migrations](#3-database-migrations)
4. [Edge Functions](#4-edge-functions)
5. [Webhook URLs](#5-webhook-urls)
6. [Cloudinary Setup](#6-cloudinary-setup)
7. [Build & Deploy](#7-build--deploy)
8. [Post-Deployment](#8-post-deployment)
9. [Monitoring](#9-monitoring)
10. [Backup & Recovery](#10-backup--recovery)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

### Required Accounts & Tools

- **Node.js** v18.x or higher
- **npm** v9.x or higher
- **Git** for version control
- **Supabase** account with a project created
- **Cloudinary** account for image storage
- **Resend** account for transactional emails
- **Payment Gateway accounts** (one or more):
  - Paystack (Ghana)
  - Stripe (international)
  - Flutterwave (Africa)
  - Hubtel (Ghana)

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/smartmart-ghana.git
cd smartmart-ghana

# Install dependencies
npm ci

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

---

## 2. Environment Variables

Create a `.env.local` file (development) or configure in your hosting platform (production) with the following variables:

### Supabase Configuration

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ **Security Warning**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Only use it in server-side code and edge functions.

### Payment Gateway Configuration

```env
# Paystack
PAYSTACK_SECRET_KEY=sk_test_or_live_your_key
PAYSTACK_PUBLIC_KEY=pk_test_or_live_your_key

# Stripe
STRIPE_SECRET_KEY=sk_test_or_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_your_key

# Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_key
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_key
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST-your_key

# Hubtel
HUBTEL_CLIENT_ID=your_client_id
HUBTEL_CLIENT_SECRET=your_client_secret
```

### Email Configuration (Resend)

```env
EMAIL_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@smartmartghana.com
```

### Cloudinary Configuration

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Application Configuration

```env
NEXT_PUBLIC_APP_URL=https://smartmartghana.com
NEXT_PUBLIC_APP_NAME=SmartMart Ghana
NODE_ENV=production
```

---

## 3. Database Migrations

### Applying Migrations via Supabase Dashboard

1. Navigate to your Supabase project dashboard.
2. Go to **SQL Editor**.
3. Run migrations in order from the `supabase/migrations/` directory.
4. Verify each migration completes successfully before proceeding to the next.

### Migration Order

The migrations should be applied in the following order:

1. **Core tables**: profiles, categories, products, product_images
2. **Order system**: orders, order_items, payments, transactions, shipping
3. **Vendor system**: vendor_profiles, stores, inventory_logs
4. **Engagement**: reviews, wishlist, chat_conversations, chat_messages
5. **Loyalty & referrals**: loyalty_points, referrals
6. **Admin**: activity_logs, platform_settings, support_tickets
7. **Security**: RLS policies, triggers, functions

### Applying via Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Or apply a specific migration
supabase migration up
```

### Verify Migrations

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

---

## 4. Edge Functions

### Deploying Edge Functions

Edge functions are deployed via the Supabase dashboard or CLI.

#### Via Supabase Dashboard

1. Navigate to **Edge Functions** in your Supabase project.
2. Click **Create Function** or select an existing function to update.
3. Deploy each function from the `supabase/functions/` directory.

#### Via Supabase CLI

```bash
# Deploy all edge functions
supabase functions deploy paystack-webhook --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy flutterwave-webhook --no-verify-jwt
supabase functions deploy hubtel-webhook --no-verify-jwt
supabase functions deploy send-email --no-verify-jwt
```

### Edge Function Secrets

Configure the following secrets for edge functions:

```bash
# Set secrets via CLI
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email secrets
supabase secrets set EMAIL_API_KEY=re_your_resend_api_key
supabase secrets set EMAIL_FROM=noreply@smartmartghana.com

# Payment gateway secrets (for webhook verification)
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
supabase secrets set FLUTTERWAVE_SECRET_KEY=FLWSECK_your_key
supabase secrets set HUBTEL_CLIENT_SECRET=your_secret
```

### Available Edge Functions

| Function | Purpose | JWT Verification |
|----------|---------|------------------|
| `paystack-webhook` | Paystack payment webhook handler | Disabled |
| `stripe-webhook` | Stripe payment webhook handler | Disabled |
| `flutterwave-webhook` | Flutterwave payment webhook handler | Disabled |
| `hubtel-webhook` | Hubtel payment webhook handler | Disabled |
| `send-email` | Transactional email service (Resend) | Disabled |

---

## 5. Webhook URLs

After deploying edge functions, configure webhook URLs in each payment gateway's dashboard.

### Paystack Webhook

- **URL**: `https://your-project.supabase.co/functions/v1/paystack-webhook`
- **Dashboard**: Paystack Dashboard → Settings → API Keys & Webhooks
- **Events to subscribe**: `charge.success`, `charge.failed`, `refund.processed`

### Stripe Webhook

- **URL**: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- **Dashboard**: Stripe Dashboard → Developers → Webhooks
- **Events to subscribe**: `checkout.session.completed`, `charge.refunded`, `checkout.session.expired`
- **Signing secret**: Copy the webhook signing secret and set as `STRIPE_WEBHOOK_SECRET`

### Flutterwave Webhook

- **URL**: `https://your-project.supabase.co/functions/v1/flutterwave-webhook`
- **Dashboard**: Flutterwave Dashboard → Settings → Webhooks
- **Events to subscribe**: `charge.completed`, `refund.completed`

### Hubtel Webhook

- **URL**: `https://your-project.supabase.co/functions/v1/hubtel-webhook`
- **Dashboard**: Hubtel Partner Dashboard → API → Webhooks
- **Events**: Success and Failed transaction notifications

---

## 6. Cloudinary Setup

### Create a Cloudinary Account

1. Sign up at [cloudinary.com](https://cloudinary.com).
2. Copy your **Cloud Name**, **API Key**, and **API Secret** from the dashboard.
3. Add them to your environment variables.

### Upload Presets

Configure upload presets for different image types:

1. Go to **Settings → Upload** in Cloudinary dashboard.
2. Create presets:
   - `product_images`: Maximum 10MB, images only, auto-tag
   - `vendor_logos`: Maximum 2MB, images only
   - `user_avatars`: Maximum 2MB, images only
   - `category_images`: Maximum 5MB, images only

### Folder Structure

Organize uploads into folders:
- `products/` — Product images
- `vendors/logos/` — Vendor store logos
- `users/avatars/` — User profile pictures
- `categories/` — Category images

### Transformation Settings

The application uses these Cloudinary transformations:
- **Optimized**: `f_auto,q_auto,w_800` — For product detail pages
- **Thumbnail**: `f_auto,q_auto,w_200,c_fill` — For product cards
- **Full size**: `f_auto,q_auto,w_1200` — For zoomed product views
- **Avatar**: `f_auto,q_auto,w_200,h_200,c_fill` — For user avatars

---

## 7. Build & Deploy

### Building the Application

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run tests
npm run test:unit
npm run test:integration

# Build for production
npm run build

# Start production server (if self-hosting)
npm start
```

### Deploying to Vercel (Recommended)

1. Connect your GitHub repository to Vercel.
2. Configure environment variables in Vercel project settings.
3. Set build command: `npm run build`
4. Set output directory: `.next`
5. Deploy automatically on push to `main` branch.

### Deploying to Other Platforms

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --build --prod
```

#### Self-Hosted (PM2)

```bash
npm ci
npm run build
pm2 start npm --name "smartmart" -- start
pm2 save
pm2 startup
```

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) automatically:
1. Runs ESLint and TypeScript checks
2. Runs unit tests
3. Runs integration tests
4. Builds the application
5. Runs security audit
6. Deploys on push to `main` branch

---

## 8. Post-Deployment

### Initial Setup Checklist

- [ ] Verify the homepage loads correctly
- [ ] Test user registration and login
- [ ] Create an admin user and verify admin access
- [ ] Configure platform settings (general, payment, shipping, tax)
- [ ] Test product creation as a vendor
- [ ] Test the checkout flow end-to-end
- [ ] Verify email sending (welcome, verification, order confirmation)
- [ ] Test webhook endpoints with sandbox/trigger events
- [ ] Verify Cloudinary image uploads
- [ ] Check that RLS policies are enforcing access control
- [ ] Test the AI search assistant

### Admin Account Setup

Create the first admin account via SQL:

```sql
-- After signing up via the app, update the user's role
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@smartmartghana.com';
```

### Seed Data

Optionally seed initial data:

```sql
-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
('Electronics', 'electronics', 'Electronic devices and accessories'),
('Fashion', 'fashion', 'Clothing, shoes, and accessories'),
('Home & Living', 'home-living', 'Home appliances and decor'),
('Health & Beauty', 'health-beauty', 'Health and beauty products'),
('Phones & Tablets', 'phones-tablets', 'Mobile phones and tablets');

-- Insert default platform settings
INSERT INTO platform_settings (category, key, value) VALUES
('general', 'site_name', 'SmartMart Ghana'),
('general', 'support_email', 'support@smartmartghana.com'),
('payment', 'default_currency', 'GHS'),
('shipping', 'default_carrier', 'Ghana Post');
```

---

## 9. Monitoring

### Application Monitoring

- **Vercel Analytics**: Monitor page load times and Core Web Vitals
- **Supabase Dashboard**: Monitor database performance, auth, and edge function logs
- **Cloudinary Dashboard**: Monitor image upload bandwidth and storage usage

### Health Check Endpoint

The application exposes a health check endpoint:

```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "smartmart-ghana",
  "version": "1.0.0",
  "database": {
    "status": "connected"
  }
}
```

Set up uptime monitoring (e.g., UptimeRobot, Pingdom) to check this endpoint.

### Edge Function Logs

Monitor edge function logs in the Supabase dashboard:
1. Go to **Edge Functions** → select function → **Logs**
2. Check for errors in webhook processing
3. Monitor email sending failures

### Database Monitoring

Monitor in Supabase dashboard:
- **Database → Reports**: Query performance, connection usage
- **Auth → Users**: User growth, active sessions
- **Storage**: File storage usage

---

## 10. Backup & Recovery

### Database Backups

Supabase provides automatic daily backups for Pro plans and above.

#### Manual Backup

```bash
# Using pg_dump
pg_dump "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  -F c -f backup_$(date +%Y%m%d).dump

# Using Supabase CLI
supabase db dump -f backup.sql
```

#### Restore from Backup

```bash
# Using pg_restore
pg_restore -d "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  backup_20240115.dump
```

### Backup Schedule

- **Automatic**: Daily (Supabase Pro plan)
- **Manual**: Before major deployments or schema changes
- **Retention**: Keep at least 7 days of backups

### Cloudinary Backups

Cloudinary automatically stores all uploaded assets. No additional backup is needed for images.

---

## 11. Troubleshooting

### Common Issues

#### Edge Functions Not Receiving Webhooks

1. Verify the webhook URL is correctly set in the payment gateway dashboard.
2. Check that the edge function is deployed and active.
3. Verify JWT verification is disabled for webhook functions.
4. Check edge function logs for errors.

#### Emails Not Sending

1. Verify `EMAIL_API_KEY` and `EMAIL_FROM` secrets are set.
2. Check Resend dashboard for sending errors.
3. Verify the recipient email is valid.
4. Check edge function logs for the `send-email` function.

#### Database Connection Errors

1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct.
2. Check Supabase project status (not paused).
3. Verify connection pool limits are not exceeded.
4. Check network/firewall settings.

#### RLS Policy Blocking Access

1. Verify the user is authenticated.
2. Check the RLS policy logic in the Supabase dashboard.
3. Test with the service role key to confirm data exists.
4. Review the policy conditions (e.g., `auth.uid() = user_id`).

#### Payment Webhook Signature Verification Fails

1. **Paystack**: Verify `x-paystack-signature` header is present.
2. **Stripe**: Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret from the Stripe dashboard.
3. **Flutterwave**: Verify the secret hash configured in Flutterwave dashboard.
4. **Hubtel**: Verify the API credentials are correct.

#### Cloudinary Upload Fails

1. Verify `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are correct.
2. Check the upload preset configuration.
3. Verify file size limits are not exceeded.
4. Check Cloudinary plan limits (monthly bandwidth, storage).

#### Build Fails

1. Run `npm run lint` to check for linting errors.
2. Run `npx tsc --noEmit` to check for TypeScript errors.
3. Clear cache: `rm -rf .next node_modules && npm ci`
4. Check for environment variable issues during build.

#### Migration Errors

1. Check for syntax errors in the SQL migration file.
2. Verify foreign key references exist before creating dependent tables.
3. Check for naming conflicts with existing tables/columns.
4. Review the Supabase SQL editor for detailed error messages.

### Getting Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Cloudinary Docs**: [cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Resend Docs**: [resend.com/docs](https://resend.com/docs)
- **Internal Support**: support@smartmartghana.com
