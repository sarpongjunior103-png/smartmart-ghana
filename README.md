# SmartMart Ghana

Ghana's smartest e-commerce marketplace — connecting customers with verified vendors across the country. Built with Next.js, Supabase, and multi-gateway payment support.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Database Schema Overview](#database-schema-overview)
- [Features](#features)
- [Documentation](#documentation)
- [Testing](#testing)
- [CI/CD](#cicd)
- [License](#license)

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, Radix UI components |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions, Storage) |
| **Database** | PostgreSQL (via Supabase) with Row Level Security |
| **Image Storage** | Cloudinary (CDN, optimization, transformations) |
| **Email Service** | Resend (transactional emails with HTML templates) |
| **Payments** | Paystack, Stripe, Flutterwave, Hubtel |
| **Search** | Custom spell-correction search API |
| **Testing** | Jest, React Testing Library |
| **CI/CD** | GitHub Actions |
| **Deployment** | Vercel (recommended) / Netlify / self-hosted |

---

## Quick Start

### Prerequisites

- Node.js v18.x or higher
- npm v9.x or higher
- A Supabase project
- A Cloudinary account
- A Resend account
- Payment gateway account(s) (Paystack, Stripe, Flutterwave, and/or Hubtel)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/smartmart-ghana.git
cd smartmart-ghana

# Install dependencies
npm ci

# Copy environment template
cp .env.example .env.local

# Configure environment variables (see .env.example for all required vars)
# Edit .env.local with your Supabase, Cloudinary, Resend, and payment gateway keys

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

See [`.env.example`](.env.example) for all required environment variables. Key variables include:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Resend)
EMAIL_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@smartmartghana.com

# Payment Gateways
PAYSTACK_SECRET_KEY=sk_test_or_live_your_key
STRIPE_SECRET_KEY=sk_test_or_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_key
HUBTEL_CLIENT_ID=your_client_id
HUBTEL_CLIENT_SECRET=your_client_secret

# Application
NEXT_PUBLIC_APP_URL=https://smartmartghana.com
NEXT_PUBLIC_APP_NAME=SmartMart Ghana
```

---

## Project Structure

```
smartmart-ghana/
├── app/                          # Next.js App Router pages and API routes
│   ├── api/
│   │   ├── health/               # Health check endpoint
│   │   └── search/               # Search API with spell correction
│   ├── (shop)/                   # Customer-facing shop pages
│   ├── admin/                    # Admin dashboard
│   ├── vendor/                   # Vendor dashboard
│   └── ...
├── lib/                          # Shared libraries and utilities
│   ├── supabase/                 # Supabase client configuration
│   ├── cloudinary/               # Cloudinary URL helpers and config
│   ├── seo/                      # SEO structured data generators
│   └── ...
├── components/                   # Reusable React components
├── supabase/
│   ├── functions/                # Supabase Edge Functions
│   │   ├── paystack-webhook/     # Paystack payment webhook
│   │   ├── stripe-webhook/       # Stripe payment webhook
│   │   ├── flutterwave-webhook/  # Flutterwave payment webhook
│   │   ├── hubtel-webhook/       # Hubtel payment webhook
│   │   └── send-email/           # Transactional email service
│   └── migrations/               # Database migration SQL files
├── tests/
│   ├── unit/                     # Unit tests (Jest)
│   └── integration/              # Integration tests (Jest + Supabase)
├── docs/                         # Documentation
│   ├── deployment-guide.md
│   ├── admin-guide.md
│   ├── vendor-guide.md
│   ├── customer-guide.md
│   ├── api-reference.md
│   └── launch-checklist.md
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD pipeline
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## Database Schema Overview

The platform uses PostgreSQL (via Supabase) with Row Level Security (RLS) on all tables. The schema is organized into the following groups:

### Core Tables
- **`profiles`** — User accounts (customers, vendors, admins), linked to Supabase Auth
- **`categories`** — Hierarchical product categories
- **`products`** — Product listings from vendors
- **`product_images`** — Product images (stored in Cloudinary)

### Order System
- **`orders`** — Customer orders with status tracking
- **`order_items`** — Individual items within an order
- **`payments`** — Payment records linked to payment gateways
- **`transactions`** — Financial transaction ledger
- **`shipping`** — Shipping and delivery tracking

### Vendor System
- **`vendor_profiles`** — Vendor-specific data (commission, payout balance)
- **`stores`** — Vendor store pages
- **`inventory_logs`** — Stock change audit trail

### Engagement
- **`reviews`** — Product reviews and ratings
- **`wishlist`** — Saved products by users
- **`chat_conversations`** — Customer-vendor chat sessions
- **`chat_messages`** — Individual chat messages

### Loyalty & Referrals
- **`loyalty_points`** — Loyalty point transactions
- **`referrals`** — Referral tracking and rewards

### Admin
- **`activity_logs`** — Audit log for all platform actions
- **`platform_settings`** — Platform configuration (key-value by category)
- **`support_tickets`** — Customer support tickets

For full table schemas, column descriptions, and RLS policies, see the [API Reference](docs/api-reference.md).

---

## Features

### Customer Features
- 🛍️ **Product Browsing** — Browse by category, search, filter, and sort
- 🔍 **AI Search Assistant** — Natural language search with spell correction
- 🛒 **Cart & Checkout** — Multi-item cart with secure checkout
- 💳 **Multiple Payment Options** — Mobile Money (MTN, Vodafone, AirtelTigo), card, bank transfer
- 📦 **Order Tracking** — Real-time order status and shipping tracking
- ❤️ **Wishlist** — Save products for later
- ⭐ **Reviews** — Rate and review purchased products
- 🏆 **Loyalty Program** — Earn points on purchases, tiered benefits
- 👥 **Referral Program** — Invite friends and earn rewards
- 💬 **Live Chat** — Chat directly with vendors
- 🌍 **Multi-Country & Multi-Language** — Ghana, Nigeria, Côte d'Ivoire, Kenya, South Africa; English, Twi, Hausa, French
- 👤 **Customer Dashboard** — Orders, wishlist, messages, loyalty, referrals

### Vendor Features
- 🏪 **Store Setup** — Custom store page with logo, banner, and description
- 📦 **Product Management** — Add, edit, and manage product listings
- 📊 **Inventory Tracking** — Stock management with audit logs
- 📋 **Order Fulfillment** — Process, ship, and track orders
- 💰 **Earnings & Payouts** — Track earnings, request payouts via Mobile Money or bank
- 💬 **Customer Communication** — Live chat with customers
- 📈 **Vendor Analytics** — Sales, performance, and growth metrics
- 🏷️ **Promotions** — Sale pricing and featured products

### Admin Features
- ⚙️ **Platform Settings** — General, payment, shipping, tax, notification, security
- 👥 **User Management** — Manage customers, vendors, and admins
- 📦 **Product Management** — Oversee and moderate all products
- 📋 **Order Management** — View and manage all platform orders
- 📊 **Analytics & Reporting** — Revenue, sales, customer, and vendor analytics
- 📝 **Audit Logs** — Complete activity log for compliance
- 🎫 **Support Tickets** — Manage customer support tickets
- ✅ **Vendor Approval** — Review and approve vendor applications

### Security Features
- 🔒 **Row Level Security** — Database-level access control on all tables
- 🔐 **Authentication** — Email/password, social login (Google, Facebook)
- 🛡️ **Two-Factor Authentication** — Available for admin accounts
- 🔍 **Input Validation** — Server-side validation on all inputs
- 🚦 **Rate Limiting** — API rate limits to prevent abuse
- 📜 **Audit Trail** — All admin and system actions logged
- 🔑 **Secure Secrets** — Service role keys never exposed to client
- 💳 **PCI Compliance** — Payment data handled by certified gateways

---

## Documentation

Comprehensive documentation is available in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [Deployment Guide](docs/deployment-guide.md) | Complete deployment instructions from prerequisites to monitoring |
| [Admin Guide](docs/admin-guide.md) | Guide for platform administrators |
| [Vendor Guide](docs/vendor-guide.md) | Guide for vendors setting up and managing their store |
| [Customer Guide](docs/customer-guide.md) | Guide for customers using the platform |
| [API Reference](docs/api-reference.md) | Full API documentation, database schema, and RLS policies |
| [Launch Checklist](docs/launch-checklist.md) | Pre-launch and post-launch checklist |

---

## Testing

### Running Tests

```bash
# Run unit tests
npm run test:unit

# Run integration tests (requires Supabase environment variables)
npm run test:integration

# Run all tests
npm test

# Run tests with coverage
npm run test:unit -- --coverage

# Run tests in watch mode
npm run test:unit -- --watch
```

### Test Structure

```
tests/
├── unit/                         # Unit tests (no external dependencies)
│   ├── search.test.ts            # Spell correction function tests
│   ├── seo.test.ts               # SEO structured data tests
│   ├── cloudinary.test.ts        # Cloudinary URL helper tests
│   └── health.test.ts            # Health check API tests
└── integration/                  # Integration tests (requires Supabase)
    ├── auth.test.ts              # Supabase auth integration tests
    ├── database.test.ts          # Database connectivity tests
    ├── checkout.test.ts          # Payment, order, shipping, transaction tests
    └── admin-vendor.test.ts      # Vendor, store, activity, inventory, loyalty, referral, chat tests
```

### Test Categories

- **Unit Tests**: Test individual functions and components in isolation. Mock external dependencies.
- **Integration Tests**: Test interactions with the Supabase database, auth, and edge functions. Require environment variables.

### Environment Variables for Testing

Integration tests require the following environment variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## CI/CD

The project uses GitHub Actions for continuous integration and deployment. The pipeline is defined in [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml).

### Pipeline Stages

| Stage | Description | Dependencies |
|-------|-------------|-------------|
| **Lint** | ESLint + TypeScript type checking | — |
| **Unit Tests** | Jest unit tests with coverage | — |
| **Integration Tests** | Jest integration tests with Supabase | Lint + Unit Tests |
| **Build** | Next.js production build | Lint + Unit Tests |
| **Security Audit** | npm audit for vulnerabilities | — |
| **Deploy** | Deploy to production | Build + Integration + Security Audit |

### Branch Strategy

- **`main`** — Production branch. Pushes trigger full pipeline + deployment.
- **`develop`** — Development branch. Pushes trigger CI pipeline (no deployment).
- **Pull Requests** — All PRs to `main` trigger the full CI pipeline.

### Setup

1. Configure the following secrets in your GitHub repository settings:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `DEPLOY_TOKEN`

2. Ensure branch protection rules require status checks before merging.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

- **Website**: [https://smartmartghana.com](https://smartmartghana.com)
- **Support Email**: support@smartmartghana.com
- **Support Phone**: +233 30 000 0000

---

<p align="center">Built with ❤️ for Ghana 🇬🇭</p>
