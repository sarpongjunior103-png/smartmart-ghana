# SmartMart Ghana — API Reference

This document provides a comprehensive reference for all APIs, edge functions, database tables, and security policies in the SmartMart Ghana platform.

---

## Table of Contents

1. [Health Check API](#1-health-check-api)
2. [Search API](#2-search-api)
3. [Payment Webhooks](#3-payment-webhooks)
4. [Send Email Edge Function](#4-send-email-edge-function)
5. [Database Tables](#5-database-tables)
6. [Row Level Security (RLS) Policies](#6-row-level-security-rls-policies)
7. [Rate Limiting](#7-rate-limiting)
8. [Error Handling](#8-error-handling)

---

## 1. Health Check API

### `GET /api/health`

Returns the health status of the application and its dependencies.

#### Request

```
GET /api/health
```

No authentication required. No request body or parameters.

#### Response (200 OK)

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "smartmart-ghana",
  "version": "1.0.0",
  "database": {
    "status": "connected"
  }
}
```

#### Response (503 Service Unavailable)

```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "smartmart-ghana",
  "version": "1.0.0",
  "database": {
    "status": "disconnected",
    "error": "Connection refused"
  }
}
```

#### Response Fields

| Field | Type | Description |
|------|------|-------------|
| `status` | string | `"healthy"` or `"unhealthy"` |
| `timestamp` | string (ISO 8601) | Current server time |
| `service` | string | Application name |
| `version` | string | Application version |
| `database.status` | string | Database connection status |
| `database.error` | string | Error message (if unhealthy) |

---

## 2. Search API

### `GET /api/search`

Search for products with spell correction and filtering.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | — | Search query (required) |
| `category` | string | — | Filter by category slug |
| `minPrice` | number | — | Minimum price filter |
| `maxPrice` | number | — | Maximum price filter |
| `sort` | string | `relevance` | Sort order: `relevance`, `price_asc`, `price_desc`, `newest`, `rating` |
| `page` | number | `1` | Page number for pagination |
| `limit` | number | `20` | Results per page (max 100) |

#### Request

```
GET /api/search?q=laptob&category=electronics&minPrice=500&maxPrice=5000&sort=price_asc&page=1&limit=20
```

#### Response (200 OK)

```json
{
  "results": [
    {
      "id": "uuid",
      "name": "Dell Laptop",
      "slug": "dell-laptop",
      "description": "High-performance laptop",
      "price": 3500.00,
      "currency": "GHS",
      "image": "https://res.cloudinary.com/...",
      "vendor": {
        "id": "uuid",
        "store_name": "TechHub Ghana"
      },
      "category": {
        "id": "uuid",
        "name": "Electronics",
        "slug": "electronics"
      },
      "rating": 4.5,
      "review_count": 23,
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  },
  "correctedQuery": "laptop"
}
```

#### Spell Correction

The search API includes automatic spell correction:
- Input: `"fone"` → Corrected: `"phone"`
- Input: `"laptob"` → Corrected: `"laptop"`
- Input: `"snekers"` → Corrected: `"sneakers"`
- Case-insensitive: `"FONE"` → `"phone"`
- Multiple words: `"fone laptob"` → `"phone laptop"`
- Correct words remain unchanged
- Empty input returns empty results

#### Response Fields

| Field | Type | Description |
|------|------|-------------|
| `results` | array | Array of product objects |
| `results[].id` | string (UUID) | Product ID |
| `results[].name` | string | Product name |
| `results[].slug` | string | URL-friendly identifier |
| `results[].price` | number | Product price |
| `results[].vendor` | object | Vendor information |
| `results[].category` | object | Category information |
| `results[].rating` | number | Average rating (0-5) |
| `results[].review_count` | number | Total number of reviews |
| `pagination.page` | number | Current page |
| `pagination.limit` | number | Results per page |
| `pagination.total` | number | Total matching results |
| `pagination.totalPages` | number | Total number of pages |
| `correctedQuery` | string \| null | Spell-corrected query (null if no correction) |

---

## 3. Payment Webhooks

All payment webhooks are implemented as Supabase Edge Functions. They receive payment events from payment gateways and update the database accordingly.

### 3.1 Paystack Webhook

#### `POST /functions/v1/paystack-webhook`

Handles Paystack payment events.

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `x-paystack-signature` | Yes | Paystack webhook signature for verification |
| `Content-Type` | Yes | `application/json` |

#### Supported Events

| Event | Action |
|-------|--------|
| `charge.success` | Updates payment status to `success`, confirms order, logs activity |
| `charge.failed` | Updates payment status to `failed`, logs activity |
| `refund.processed` | Updates payment status to `refunded`, logs activity |

#### Request Body (charge.success)

```json
{
  "event": "charge.success",
  "data": {
    "reference": "SM-12345-ABC",
    "amount": 350000,
    "currency": "GHS",
    "status": "success",
    "customer": {
      "email": "customer@example.com"
    }
  }
}
```

#### Response (200 OK)

```json
{
  "status": "success"
}
```

#### Response (401 Unauthorized)

```json
{
  "error": "Missing signature"
}
```

#### Database Updates

On `charge.success`:
1. Updates `payments` table: `status` → `success`, `gateway_response` → event data
2. Updates `transactions` table: `status` → `success`
3. Updates `orders` table: `status` → `confirmed` (if payment has an order)
4. Inserts into `activity_logs`: action `payment_success`

On `charge.failed`:
1. Updates `payments` table: `status` → `failed`
2. Updates `transactions` table: `status` → `failed`
3. Inserts into `activity_logs`: action `payment_failed`

On `refund.processed`:
1. Updates `payments` table: `status` → `refunded`
2. Updates `transactions` table: `status` → `refunded`
3. Inserts into `activity_logs`: action `payment_refunded`

---

### 3.2 Stripe Webhook

#### `POST /functions/v1/stripe-webhook`

Handles Stripe payment events.

#### Supported Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Updates payment status to `success`, confirms order |
| `charge.refunded` | Updates payment status to `refunded` |
| `checkout.session.expired` | Updates payment status to `failed` |

#### Request Body (checkout.session.completed)

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "client_reference_id": "SM-12345-ABC",
      "amount_total": 350000,
      "currency": "ghs",
      "payment_status": "paid"
    }
  }
}
```

#### Response (200 OK)

```json
{
  "received": true
}
```

#### Reference Mapping

- Stripe uses `client_reference_id` to map to the SmartMart payment reference
- For refunds, the reference is stored in `charge.metadata.reference`

---

### 3.3 Flutterwave Webhook

#### `POST /functions/v1/flutterwave-webhook`

Handles Flutterwave payment events.

#### Supported Events

| Event | Action |
|-------|--------|
| `charge.completed` (status: `successful`) | Updates payment status to `success` |
| `charge.completed` (status: other) | Updates payment status to `failed` |
| `refund.completed` | Updates payment status to `refunded` |

#### Request Body (charge.completed)

```json
{
  "event": "charge.completed",
  "data": {
    "tx_ref": "SM-12345-ABC",
    "amount": 3500,
    "currency": "GHS",
    "status": "successful"
  }
}
```

#### Response (200 OK)

```json
{
  "status": "success"
}
```

#### Reference Mapping

- Flutterwave uses `tx_ref` as the transaction reference
- Status `"successful"` maps to payment status `success`; any other status maps to `failed`

---

### 3.4 Hubtel Webhook

#### `POST /functions/v1/hubtel-webhook`

Handles Hubtel payment events.

#### Supported Events

| Event Condition | Action |
|----------------|--------|
| `status === "Success"` or `Data.Status === "Success"` | Updates payment status to `success` |
| `status === "Failed"` or `Data.Status === "Failed"` | Updates payment status to `failed` |

#### Request Body (Success)

```json
{
  "status": "Success",
  "ClientReference": "SM-12345-ABC",
  "Amount": 3500,
  "Currency": "GHS"
}
```

#### Alternative Request Body (with Data wrapper)

```json
{
  "Data": {
    "Status": "Success",
    "ClientReference": "SM-12345-ABC",
    "Amount": 3500
  }
}
```

#### Response (200 OK)

```json
{
  "status": "success"
}
```

#### Reference Mapping

- Hubtel uses `ClientReference` (or `Data.ClientReference`) as the payment reference
- The webhook checks both top-level and `Data`-nested fields for compatibility

---

### Common Webhook Behavior

All four webhook handlers share the same `updatePaymentStatus` function that:

1. **Looks up the payment** by `gateway_reference` in the `payments` table
2. **Updates the payment record** with the new status and gateway response
3. **Updates the corresponding transaction** in the `transactions` table
4. **Confirms the order** (if status is `success` and the payment has an `order_id`)
5. **Logs the activity** (Paystack webhooks also insert into `activity_logs`)

---

## 4. Send Email Edge Function

### `POST /functions/v1/send-email`

Sends transactional emails using the Resend API with pre-built HTML templates.

#### Request

```
POST /functions/v1/send-email
Content-Type: application/json
```

#### Request Body

```json
{
  "to": "customer@example.com",
  "template": "welcome",
  "data": {
    "name": "John Doe"
  }
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string | Yes | Recipient email address |
| `template` | string | Yes | Template name (see below) |
| `data` | object | No | Template variables |

#### Available Templates

| Template | Description | Data Fields |
|----------|-------------|------------|
| `welcome` | Welcome email for new users | `name` |
| `email_verification` | Email verification with code | `name`, `code`, `verification_url` |
| `password_reset` | Password reset link | `name`, `reset_url` |
| `order_confirmation` | Order confirmation with items | `order_number`, `items[]`, `total`, `currency` |
| `order_shipped` | Shipping notification | `order_number`, `tracking_number`, `carrier`, `tracking_url` |
| `order_delivered` | Delivery confirmation | `order_number`, `review_url` |
| `refund_notification` | Refund processed | `order_number`, `amount`, `currency`, `reason` |
| `vendor_approval` | Vendor application approved | `name`, `store_name` |
| `vendor_rejection` | Vendor application rejected | `name`, `reason` |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Email 'welcome' sent to customer@example.com"
}
```

#### Response (400 Bad Request)

```json
{
  "error": "Missing required fields: 'to' and 'template' are required"
}
```

```json
{
  "error": "Unknown template 'invalid_template'. Available: welcome, email_verification, password_reset, order_confirmation, order_shipped, order_delivered, refund_notification, vendor_approval, vendor_rejection"
}
```

#### Response (500 Internal Server Error)

```json
{
  "error": "EMAIL_API_KEY is not configured"
}
```

```json
{
  "error": "Resend API error: ..."
}
```

#### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAIL_API_KEY` | Yes | Resend API key |
| `EMAIL_FROM` | No | From email address (defaults to noreply@domain) |

#### Email Template Features

- All templates use SmartMart Ghana branded HTML styling
- Responsive design for mobile and desktop email clients
- Inline CSS for maximum email client compatibility
- Primary color: `#0F766E` (teal)
- Includes header with logo, content body, and footer
- Call-to-action buttons in branded colors

---

## 5. Database Tables

### Core Tables

#### `profiles`
Stores user profile information linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | References `auth.users.id` |
| `email` | text | User email |
| `full_name` | text | Full name |
| `phone` | text | Phone number |
| `avatar_url` | text | Profile image URL |
| `role` | enum | `customer`, `vendor`, `admin` |
| `created_at` | timestamptz | Registration date |
| `updated_at` | timestamptz | Last update |

#### `categories`
Product categories with hierarchical structure.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Category ID |
| `name` | text | Category name |
| `slug` | text | URL slug |
| `description` | text | Category description |
| `parent_id` | UUID | Parent category (null for root) |
| `image_url` | text | Category image |
| `created_at` | timestamptz | Creation date |

#### `products`
Products listed by vendors.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Product ID |
| `vendor_id` | UUID | References `profiles.id` |
| `category_id` | UUID | References `categories.id` |
| `name` | text | Product name |
| `slug` | text | URL slug |
| `description` | text | Full description |
| `price` | numeric | Product price |
| `currency` | text | Currency code (GHS) |
| `stock_quantity` | integer | Available stock |
| `status` | enum | `active`, `inactive`, `pending`, `rejected` |
| `featured` | boolean | Featured on homepage |
| `created_at` | timestamptz | Creation date |
| `updated_at` | timestamptz | Last update |

#### `product_images`
Images for products (stored in Cloudinary).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Image ID |
| `product_id` | UUID | References `products.id` |
| `url` | text | Cloudinary URL |
| `alt_text` | text | Alt description |
| `position` | integer | Display order |

### Order System Tables

#### `orders`
Customer orders.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Order ID |
| `order_number` | text | Human-readable order number |
| `customer_id` | UUID | References `profiles.id` |
| `total` | numeric | Order total |
| `currency` | text | Currency code |
| `status` | enum | `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded` |
| `payment_status` | enum | `pending`, `success`, `failed`, `refunded` |
| `shipping_address` | jsonb | Shipping address |
| `created_at` | timestamptz | Order date |

#### `order_items`
Individual items within an order.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Item ID |
| `order_id` | UUID | References `orders.id` |
| `product_id` | UUID | References `products.id` |
| `quantity` | integer | Quantity ordered |
| `price` | numeric | Price per unit at time of order |

#### `payments`
Payment records for orders.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Payment ID |
| `order_id` | UUID | References `orders.id` |
| `gateway` | enum | `paystack`, `stripe`, `flutterwave`, `hubtel` |
| `gateway_reference` | text | Gateway transaction reference |
| `amount` | numeric | Payment amount |
| `currency` | text | Currency code |
| `status` | enum | `pending`, `success`, `failed`, `refunded` |
| `gateway_response` | jsonb | Raw gateway response |

#### `transactions`
Financial transaction ledger.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Transaction ID |
| `transaction_reference` | text | Transaction reference |
| `user_id` | UUID | References `profiles.id` |
| `type` | enum | `payment`, `refund`, `payout`, `commission` |
| `amount` | numeric | Transaction amount |
| `currency` | text | Currency code |
| `status` | enum | `pending`, `success`, `failed` |
| `created_at` | timestamptz | Transaction date |

#### `shipping`
Shipping records for orders.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Shipping ID |
| `order_id` | UUID | References `orders.id` |
| `carrier` | text | Shipping carrier |
| `tracking_number` | text | Tracking number |
| `status` | enum | `pending`, `shipped`, `delivered` |
| `shipping_cost` | numeric | Shipping cost |
| `created_at` | timestamptz | Creation date |

### Vendor Tables

#### `vendor_profiles`
Vendor-specific profile data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Vendor profile ID |
| `store_name` | text | Store name |
| `status` | enum | `pending`, `approved`, `suspended` |
| `commission_rate` | numeric | Commission percentage |
| `payout_balance` | numeric | Available payout balance |
| `business_address` | text | Business address |
| `business_documents` | jsonb | Uploaded documents |

#### `stores`
Vendor store pages.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Store ID |
| `vendor_id` | UUID | References `profiles.id` |
| `name` | text | Store display name |
| `slug` | text | URL slug |
| `description` | text | Store description |
| `logo_url` | text | Store logo |
| `status` | enum | `active`, `paused`, `suspended` |

#### `inventory_logs`
Stock change audit trail.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Log ID |
| `product_id` | UUID | References `products.id` |
| `change_type` | enum | `restock`, `sale`, `adjustment`, `return` |
| `quantity_change` | integer | Positive or negative change |
| `previous_stock` | integer | Stock before change |
| `new_stock` | integer | Stock after change |
| `reason` | text | Reason for change |
| `created_at` | timestamptz | Change date |

### Engagement Tables

#### `reviews`
Product reviews from customers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Review ID |
| `product_id` | UUID | References `products.id` |
| `user_id` | UUID | References `profiles.id` |
| `rating` | integer | 1-5 stars |
| `comment` | text | Review text |
| `created_at` | timestamptz | Review date |

#### `wishlist`
Saved products by users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Wishlist item ID |
| `user_id` | UUID | References `profiles.id` |
| `product_id` | UUID | References `products.id` |
| `created_at` | timestamptz | Added date |

#### `chat_conversations`
Customer-vendor chat sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Conversation ID |
| `customer_id` | UUID | References `profiles.id` |
| `vendor_id` | UUID | References `profiles.id` |
| `product_id` | UUID | References `products.id` (nullable) |
| `status` | enum | `active`, `closed`, `archived` |
| `last_message_at` | timestamptz | Last message time |

#### `chat_messages`
Individual messages within conversations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Message ID |
| `conversation_id` | UUID | References `chat_conversations.id` |
| `sender_id` | UUID | References `profiles.id` |
| `message` | text | Message content |
| `attachments` | jsonb | Image attachments |
| `created_at` | timestamptz | Message time |

### Loyalty & Referral Tables

#### `loyalty_points`
Loyalty point transactions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Entry ID |
| `user_id` | UUID | References `profiles.id` |
| `points` | integer | Points (positive for earned, negative for redeemed) |
| `points_type` | enum | `earned`, `redeemed`, `expired`, `adjusted` |
| `description` | text | Description |
| `created_at` | timestamptz | Entry date |

#### `referrals`
Referral tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Referral ID |
| `referrer_id` | UUID | References `profiles.id` |
| `referred_id` | UUID | References `profiles.id` |
| `referral_code` | text | Unique referral code |
| `status` | enum | `pending`, `completed`, `rewarded` |
| `reward_amount` | numeric | Reward value |
| `created_at` | timestamptz | Referral date |

### Admin Tables

#### `activity_logs`
Audit log for all platform actions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Log ID |
| `user_id` | UUID | References `profiles.id` (nullable for system) |
| `action` | text | Action identifier |
| `entity_type` | text | Entity type |
| `entity_id` | UUID | Entity ID |
| `details` | jsonb | Additional details |
| `created_at` | timestamptz | Action time |

#### `platform_settings`
Platform configuration settings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Setting ID |
| `category` | enum | `general`, `payment`, `shipping`, `tax`, `notification`, `security` |
| `key` | text | Setting key |
| `value` | text | Setting value |

#### `support_tickets`
Customer support tickets.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Ticket ID |
| `user_id` | UUID | References `profiles.id` |
| `subject` | text | Ticket subject |
| `description` | text | Issue description |
| `status` | enum | `open`, `in_progress`, `resolved`, `closed` |
| `priority` | enum | `low`, `medium`, `high`, `urgent` |
| `category` | enum | `order`, `payment`, `account`, `product`, `other` |
| `created_at` | timestamptz | Creation date |

---

## 6. Row Level Security (RLS) Policies

All tables have RLS enabled. Below are the policy patterns used across the platform.

### Policy Patterns

#### Customer Access

```sql
-- Customers can view their own data
CREATE POLICY "users_select_own" ON orders
  FOR SELECT USING (auth.uid() = customer_id);

-- Customers can insert their own records
CREATE POLICY "users_insert_own" ON orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
```

#### Vendor Access

```sql
-- Vendors can manage their own products
CREATE POLICY "vendors_manage_products" ON products
  FOR ALL USING (auth.uid() = vendor_id);

-- Vendors can view orders containing their products
CREATE POLICY "vendors_view_orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = orders.id AND p.vendor_id = auth.uid()
    )
  );
```

#### Admin Access

```sql
-- Admins have full access to all tables
CREATE POLICY "admin_all_access" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

#### Public Read Access

```sql
-- Anyone can view active products
CREATE POLICY "public_read_products" ON products
  FOR SELECT USING (status = 'active');
```

### Table-Specific RLS Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | Own profile + admin | Via auth trigger | Own + admin | Admin only |
| `products` | Public (active) + vendor (own) + admin | Vendor + admin | Vendor (own) + admin | Vendor (own) + admin |
| `orders` | Customer (own) + vendor (related) + admin | Customer | Vendor (status) + admin | Admin only |
| `payments` | Customer (own) + admin | System + admin | System + admin | Admin only |
| `reviews` | Public + customer (own) + admin | Customer (verified purchase) | Customer (own) + admin | Admin only |
| `vendor_profiles` | Public (approved) + vendor (own) + admin | Customer (on apply) | Vendor (own) + admin | Admin only |
| `activity_logs` | Admin only | System + authenticated | Admin only | Admin only |
| `platform_settings` | Public (general) + admin | Admin only | Admin only | Admin only |

---

## 7. Rate Limiting

### API Rate Limits

| Endpoint | Authenticated | Anonymous |
|----------|--------------|-----------|
| `/api/search` | 60 req/min | 30 req/min |
| `/api/health` | 120 req/min | 120 req/min |
| Edge Functions | 30 req/min | 10 req/min |
| Supabase Auth | 5 req/min | 5 req/min |

### Rate Limit Headers

All API responses include rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705312200
```

### Rate Limit Exceeded (429)

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 60 seconds.",
  "retryAfter": 60
}
```

---

## 8. Error Handling

### Error Response Format

All API errors follow a consistent JSON format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {}
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 405 | Method Not Allowed |
| 409 | Conflict (duplicate resource) |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Common Errors

#### 400 Bad Request

```json
{
  "error": "Validation error",
  "message": "Missing required field: 'email'",
  "details": {
    "field": "email",
    "rule": "required"
  }
}
```

#### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to perform this action"
}
```

#### 404 Not Found

```json
{
  "error": "Not found",
  "message": "Product not found"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

### Edge Function Errors

Edge functions return errors in the following format:

```json
{
  "error": "Error message from exception"
}
```

With appropriate HTTP status codes (400, 401, 405, 500).
