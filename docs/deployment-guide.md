# Deployment Guide

This guide covers the complete deployment process for SmartMart, from local development to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Deployment (Supabase)](#database-deployment-supabase)
4. [Edge Functions Deployment](#edge-functions-deployment)
5. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
6. [Payment Gateway Configuration](#payment-gateway-configuration)
7. [Email Service Configuration](#email-service-configuration)
8. [Cloudinary Configuration](#cloudinary-configuration)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Domain & DNS Setup](#domain--dns-setup)
11. [Post-Deployment Checklist](#post-deployment-checklist)
12. [Rollback Procedure](#rollback-procedure)
13. [Monitoring & Alerts](#monitoring--alerts)
14. [Troubleshooting](#troubleshooting)
15. [Support](#support)

---

## Prerequisites

Before deploying, ensure you have the following:

- **Node.js** 18.x or later
- **npm** 9.x or later
- **Git** installed and configured
- A **Supabase** project (https://supabase.com)
- A **Vercel** account (https://vercel.com)
- A **Cloudinary** account (https://cloudinary.com)
- A **Resend** account for email (https://resend.com)
- Payment gateway accounts:
  - **Paystack** (https://paystack.com)
  - **Stripe** (https://stripe.com)
  - **Flutterwave** (https://flutterwave.com)
  - **Hubtel** (https://hubtel.com)

---

## Environment Setup

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/smartmart.git
   cd smartmart
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in the environment variables (see below).

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGci...` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `smartmart` |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-secret` |
| `RESEND_API_KEY` | Resend API key | `re_xxxxxxxx` |
| `EMAIL_FROM` | Sender email address | `smartmart304@gmail.com` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | `sk_live_xxxxxxxx` |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | `pk_live_xxxxxxxx` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_xxxxxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_xxxxxxxx` |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key | `FLWSECK-xxxxxxxx` |
| `FLUTTERWAVE_PUBLIC_KEY` | Flutterwave public key | `FLWPUBK-xxxxxxxx` |
| `HUBTEL_CLIENT_ID` | Hubtel client ID | `your-client-id` |
| `HUBTEL_CLIENT_SECRET` | Hubtel client secret | `your-client-secret` |

---

## Database Deployment (Supabase)

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your Project URL and API keys from **Settings → API**.
3. Set the database password securely.

### 2. Run Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

### 3. Configure RLS Policies

Row Level Security (RLS) policies are included in the migrations. Verify they are active:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 4. Seed Initial Data

```bash
supabase db seed
```

This populates:
- Default categories
- Admin user
- Default settings
- Sample products (optional)

---

## Edge Functions Deployment

SmartMart uses five Supabase Edge Functions:

| Function | Purpose |
|---|---|
| `paystack-webhook` | Handles Paystack payment callbacks |
| `stripe-webhook` | Handles Stripe payment callbacks |
| `flutterwave-webhook` | Handles Flutterwave payment callbacks |
| `hubtel-webhook` | Handles Hubtel payment callbacks |
| `send-email` | Sends branded transactional emails via Resend |

### Deploy All Functions

```bash
# Deploy each function
supabase functions deploy paystack-webhook --project-ref your-project-ref
supabase functions deploy stripe-webhook --project-ref your-project-ref
supabase functions deploy flutterwave-webhook --project-ref your-project-ref
supabase functions deploy hubtel-webhook --project-ref your-project-ref
supabase functions deploy send-email --project-ref your-project-ref
```

### Set Edge Function Secrets

```bash
supabase secrets set \
  PAYSTACK_SECRET_KEY=sk_live_xxxxxxxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx \
  FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxxxxx \
  FLUTTERWAVE_WEBHOOK_HASH=your-hash \
  HUBTEL_CLIENT_ID=your-client-id \
  HUBTEL_CLIENT_SECRET=your-client-secret \
  HUBTEL_WEBHOOK_SECRET=your-webhook-secret \
  RESEND_API_KEY=re_xxxxxxxx \
  EMAIL_FROM=smartmart304@gmail.com \
  --project-ref your-project-ref
```

### Configure Webhook URLs

After deploying, set the webhook URLs in each payment gateway's dashboard:

- **Paystack**: `https://your-project-ref.supabase.co/functions/v1/paystack-webhook`
- **Stripe**: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
- **Flutterwave**: `https://your-project-ref.supabase.co/functions/v1/flutterwave-webhook`
- **Hubtel**: `https://your-project-ref.supabase.co/functions/v1/hubtel-webhook`

---

## Frontend Deployment (Vercel)

### 1. Import the Project

1. Go to [vercel.com](https://vercel.com) and click **New Project**.
2. Import your GitHub repository.
3. Select **Next.js** as the framework preset.

### 2. Configure Environment Variables

Add all `NEXT_PUBLIC_*` and server-side environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### 3. Deploy

```bash
# Using Vercel CLI
npm install -g vercel
vercel --prod
```

Or push to the `main` branch — the CI/CD pipeline will deploy automatically.

### 4. Custom Domain

1. In Vercel, go to **Settings → Domains**.
2. Add your custom domain (e.g., `smartmart.com`).
3. Configure DNS records as instructed by Vercel.
4. Wait for SSL certificate provisioning.

---

## Payment Gateway Configuration

### Paystack

1. Log in to your [Paystack dashboard](https://dashboard.paystack.com).
2. Go to **Settings → API Keys** to get your public and secret keys.
3. Go to **Settings → Webhooks** and add the webhook URL.
4. Set the webhook secret for signature verification.

### Stripe

1. Log in to your [Stripe dashboard](https://dashboard.stripe.com).
2. Go to **Developers → API Keys** to get your keys.
3. Go to **Developers → Webhooks** and add an endpoint for:
   - `checkout.session.completed`
   - `charge.refunded`
   - `checkout.session.expired`
4. Copy the signing secret for `STRIPE_WEBHOOK_SECRET`.

### Flutterwave

1. Log in to your [Flutterwave dashboard](https://dashboard.flutterwave.com).
2. Go to **Settings → API Keys** to get your keys.
3. Set the webhook URL and hash in **Settings → Webhooks**.

### Hubtel

1. Log in to your [Hubtel dashboard](https://console.hubtel.com).
2. Go to **Settings → API** to get your client ID and secret.
3. Configure the webhook URL for payment notifications.

---

## Email Service Configuration

SmartMart uses [Resend](https://resend.com) for transactional emails.

1. Create a Resend account and get your API key.
2. Set `RESEND_API_KEY` in your Supabase Edge Function secrets.
3. Set `EMAIL_FROM` to `smartmart304@gmail.com`.
4. Verify your sending domain in Resend (if using a custom domain).

### Email Templates

The `send-email` edge function supports 9 branded templates:

| Template | Trigger |
|---|---|
| `welcome` | New user registration |
| `email_verification` | Email verification required |
| `password_reset` | Password reset requested |
| `order_confirmation` | Order placed and confirmed |
| `order_shipped` | Order dispatched |
| `order_delivered` | Order delivered |
| `refund_notification` | Refund processed |
| `vendor_approval` | Vendor application approved |
| `vendor_rejection` | Vendor application rejected |

All emails include the SmartMart contact information in the footer:
- **Phone:** +233 55 162 1261
- **Email:** smartmart304@gmail.com

---

## Cloudinary Configuration

1. Create a [Cloudinary](https://cloudinary.com) account.
2. Copy your cloud name, API key, and API secret from the dashboard.
3. Set the environment variables:
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `NEXT_PUBLIC_CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Configure upload presets for product images, avatars, and store logos.

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs the following jobs:

| Job | Description |
|---|---|
| `lint` | ESLint + Prettier check |
| `unit-tests` | Jest unit tests |
| `integration-tests` | Integration tests with Supabase |
| `build` | Next.js production build |
| `security-audit` | npm audit + CodeQL analysis |
| `deploy` | Deploy to Vercel + Supabase Edge Functions (main branch only) |

### Required GitHub Secrets

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN`
- All payment gateway keys

---

## Domain & DNS Setup

### DNS Records

| Type | Name | Value |
|---|---|---|
| A | `@` | Vercel IP (provided) |
| CNAME | `www` | `cname.vercel-dns.com` |
| MX | `@` | Your email provider's MX records |
| TXT | `@` | SPF, DKIM, DMARC records |

### SSL Certificate

Vercel automatically provisions SSL certificates for custom domains. No additional configuration is needed.

---

## Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] RLS policies enabled on all tables
- [ ] Edge functions deployed and secrets configured
- [ ] Webhook URLs set in all payment gateways
- [ ] Test webhook received from each payment gateway
- [ ] Frontend deployed to Vercel
- [ ] Custom domain configured and SSL active
- [ ] Environment variables set in Vercel
- [ ] Cloudinary upload presets configured
- [ ] Resend sending domain verified
- [ ] Test email sent and received
- [ ] Test order placed end-to-end
- [ ] Test payment processed via each gateway
- [ ] Test refund processed
- [ ] Admin dashboard accessible
- [ ] Vendor registration flow tested
- [ ] Customer registration flow tested
- [ ] Search and spell correction working
- [ ] Live chat functional
- [ ] CI/CD pipeline passing on main branch

---

## Rollback Procedure

### Frontend Rollback

1. In Vercel, go to **Deployments**.
2. Find the last stable deployment.
3. Click the **⋯** menu and select **Promote to Production**.

### Database Rollback

```bash
# Roll back to a previous migration
supabase db reset --to migration_name
```

### Edge Function Rollback

```bash
# Redeploy the previous version of a function
supabase functions deploy function-name --project-ref your-project-ref
```

---

## Monitoring & Alerts

### Supabase Monitoring

- Go to **Supabase Dashboard → Logs** to view database and function logs.
- Set up alerts for error rates and latency.

### Vercel Monitoring

- Go to **Vercel Dashboard → Analytics** to view web vitals and traffic.
- Configure Slack/Email notifications for deployment failures.

### Payment Monitoring

- Monitor webhook delivery in each payment gateway's dashboard.
- Check the `activity_logs` table for payment events.
- Set up alerts for failed payments.

---

## Troubleshooting

### Common Issues

**Edge function returns 401 on webhook**
- Verify the webhook secret is set correctly in Supabase secrets.
- Check that the payment gateway is sending the correct signature header.

**Emails not sending**
- Verify `RESEND_API_KEY` is set in Edge Function secrets.
- Check that `EMAIL_FROM` is set to `smartmart304@gmail.com`.
- Review the Resend dashboard for delivery failures.

**Database connection errors**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct.
- Check that RLS policies are not blocking access.
- Ensure the service role key is only used server-side.

**Payment not confirmed**
- Check the webhook URL is reachable (no firewall blocking).
- Verify the signature verification logic.
- Check the `payments` and `activity_logs` tables for the transaction.

---

## Support

If you encounter issues during deployment, please contact our support team:

- **Phone:** +233 55 162 1261
- **Email:** smartmart304@gmail.com

Our team is available to assist with deployment, configuration, and troubleshooting.
