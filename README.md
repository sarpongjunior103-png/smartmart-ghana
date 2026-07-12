# SmartMart

A full-featured multi-vendor e-commerce marketplace built with Next.js, Supabase, and Cloudinary. SmartMart supports multiple payment gateways, vendor stores, live chat, loyalty programs, referrals, and more.

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
- [Contact](#contact)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Edge Functions | Supabase Edge Functions (Deno) |
| File Storage | Cloudinary |
| Email Service | Resend |
| Payments | Paystack, Stripe, Flutterwave, Hubtel |
| Deployment | Vercel (frontend), Supabase (database + functions) |
| CI/CD | GitHub Actions |
| Testing | Jest |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project
- A Cloudinary account
- A Resend account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/smartmart.git
cd smartmart

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your environment variables in .env.local
# (See the Environment Setup section in the deployment guide)

# Run database migrations
npx supabase db push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Project Structure

```
smartmart/
├── app/                          # Next.js App Router pages
│   ├── admin/
│   │   └── settings/
│   │       └── page.tsx          # Admin settings (6 tabs)
│   ├── api/
│   │   └── health/
│   │       └── route.ts          # Health check endpoint
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── lib/                          # Shared libraries
│   ├── contact.ts                # Contact info constants
│   ├── cloudinary.ts             # Cloudinary URL helpers
│   ├── search/
│   │   └── spell-correct.ts      # Spell correction logic
│   └── seo/
│       └── structured-data.ts   # SEO structured data schemas
├── supabase/
│   ├── migrations/               # Database migrations
│   └── functions/                # Edge Functions
│       ├── paystack-webhook/     # Paystack payment webhook
│       ├── stripe-webhook/       # Stripe payment webhook
│       ├── flutterwave-webhook/  # Flutterwave payment webhook
│       ├── hubtel-webhook/       # Hubtel payment webhook
│       └── send-email/           # Email service (9 templates)
├── tests/
│   ├── unit/                     # Unit tests
│   │   ├── search.test.ts
│   │   ├── seo.test.ts
│   │   ├── cloudinary.test.ts
│   │   └── health.test.ts
│   └── integration/              # Integration tests
│       ├── auth.test.ts
│       ├── database.test.ts
│       ├── checkout.test.ts
│       └── admin-vendor.test.ts
├── docs/                         # Documentation
│   ├── deployment-guide.md
│   ├── admin-guide.md
│   ├── vendor-guide.md
│   ├── customer-guide.md
│   ├── api-reference.md
│   └── launch-checklist.md
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # CI/CD pipeline
└── README.md
```

---

## Database Schema Overview

SmartMart uses Supabase (PostgreSQL) with the following core tables:

### User & Auth
- **`profiles`** — User profiles (customers, vendors, admins) with roles
- **`addresses`** — Saved shipping addresses

### Catalog
- **`categories`** — Product categories
- **`products`** — Product listings with vendor association
- **`product_images`** — Images for each product

### Orders & Payments
- **`orders`** — Customer orders with status tracking
- **`order_items`** — Individual items within orders
- **`payments`** — Payment records with gateway and status
- **`transactions`** — Transaction log (payments, refunds)

### Cart & Wishlist
- **`carts`** — Shopping carts
- **`cart_items`** — Items in shopping carts
- **`wishlists`** — User wishlists

### Vendor
- **`vendor_profiles`** — Vendor business profiles
- **`stores`** — Vendor storefronts
- **`inventory_logs`** — Inventory change history

### Engagement
- **`reviews`** — Product reviews and ratings
- **`loyalty_points`** — Loyalty point transactions
- **`referrals** — User referral records
- **`chat_conversations`** — Live chat conversations
- **`chat_messages`** — Individual chat messages
- **`support_tickets`** — Customer support tickets

### System
- **`activity_logs`** — Audit log of all system actions
- **`settings`** — Application settings (key-value store)

All tables have **Row Level Security (RLS)** enabled with policies ensuring:
- Users can only access their own data
- Vendors can only manage their own products and orders
- Admins have full access
- Public read access for active products and categories

---

## Features

### Customer Features
- 🔐 Email/password authentication with email verification
- 🔍 Product search with spell correction
- 🛒 Shopping cart and secure checkout
- 💳 Multiple payment options (Paystack, Stripe, Flutterwave, Hubtel)
- 📦 Order tracking with shipping notifications
- ❤️ Wishlist and saved items
- ⭐ Product reviews and ratings
- 🎁 Loyalty points program with tiers (Bronze → Platinum)
- 🤝 Referral program with rewards
- 💬 Live chat with vendors
- 📊 Account dashboard with order history

### Vendor Features
- 🏪 Customizable storefront with logo and banner
- 📦 Product management (add, edit, delete, bulk operations)
- 📊 Inventory management with stock tracking and alerts
- 🚚 Order fulfillment pipeline (confirmed → shipped → delivered)
- 💰 Earnings tracking and payout management
- 💬 Customer communication via live chat
- 📈 Sales analytics and reports

### Admin Features
- 📊 Dashboard with key metrics and recent activity
- ⚙️ Settings management with 6 tabs (general, payment, shipping, tax, notification, security)
- 👥 User management (view, suspend, change roles)
- 📦 Product moderation and approval
- 📋 Order management and dispute resolution
- 🏪 Vendor approval and store management
- 📊 Analytics and reporting
- 📝 Audit logs for all system actions
- 🎫 Support ticket management
- 🔒 Security controls (2FA, IP whitelist, maintenance mode)

### Technical Features
- 🌐 SEO optimized with structured data (Schema.org)
- 📱 Responsive design (mobile, tablet, desktop)
- ⚡ Image optimization via Cloudinary
- 📧 9 branded email templates via Resend
- 🔗 4 payment gateway integrations with webhook handling
- 🛡️ Row Level Security on all database tables
- 🚀 CI/CD pipeline with automated testing and deployment
- 📊 Health check endpoint for monitoring

---

## Documentation

| Document | Description |
|---|---|
| [Deployment Guide](docs/deployment-guide.md) | Complete deployment instructions |
| [Admin Guide](docs/admin-guide.md) | Admin panel usage and management |
| [Vendor Guide](docs/vendor-guide.md) | Vendor registration and store management |
| [Customer Guide](docs/customer-guide.md) | Customer shopping and account guide |
| [API Reference](docs/api-reference.md) | API endpoints, webhooks, and database schema |
| [Launch Checklist](docs/launch-checklist.md) | Pre-launch validation checklist (15 sections) |

---

## Testing

### Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run all integration tests
npm run test:integration

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure

| Directory | Description |
|---|---|
| `tests/unit/` | Unit tests for individual functions and components |
| `tests/integration/` | Integration tests for database, auth, and API flows |

### Unit Tests

| Test File | What it Tests |
|---|---|
| `search.test.ts` | Spell correction (e.g., "fone" → "phone", "laptob" → "laptop") |
| `seo.test.ts` | Structured data schemas (Website, Organization, Product, Breadcrumb) |
| `cloudinary.test.ts` | Image URL generation (optimized, thumbnail, full-size, avatar) |
| `health.test.ts` | Health check API endpoint |

### Integration Tests

| Test File | What it Tests |
|---|---|
| `auth.test.ts` | Supabase authentication (sign up, sign in, session, RLS) |
| `database.test.ts` | Database connectivity and table access |
| `checkout.test.ts` | Payments, orders, shipping, transactions |
| `admin-vendor.test.ts` | Vendor profiles, stores, activity logs, inventory logs, loyalty points, referrals, chat |

---

## CI/CD

The GitHub Actions pipeline (`.github/workflows/ci-cd.yml`) runs on every push and pull request to `main` and `develop` branches.

### Pipeline Jobs

| Job | Description | Trigger |
|---|---|---|
| `lint` | ESLint + Prettier check | All pushes/PRs |
| `unit-tests` | Jest unit tests | After lint |
| `integration-tests` | Integration tests with Supabase | After unit tests |
| `build` | Next.js production build | After integration tests |
| `security-audit` | npm audit + CodeQL analysis | After build |
| `deploy` | Deploy to Vercel + Supabase Edge Functions | `main` branch only |

### Required Secrets

Configure the following secrets in your GitHub repository settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`
- Payment gateway keys (Paystack, Stripe, Flutterwave, Hubtel)
- `RESEND_API_KEY`

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

For questions, support, or inquiries about SmartMart:

- **Phone:** +233 55 162 1261
- **Email:** smartmart304@gmail.com

We're committed to providing a secure, reliable, and user-friendly marketplace experience. Don't hesitate to reach out!
