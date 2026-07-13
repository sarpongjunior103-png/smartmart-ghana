# API Reference

This document provides a comprehensive reference for SmartMart's APIs, edge functions, database schema, and security policies.

---

## Table of Contents

1. [Health Check API](#health-check-api)
2. [Search API](#search-api)
3. [Payment Webhooks](#payment-webhooks)
4. [Send Email Function](#send-email-function)
5. [Database Tables](#database-tables)
6. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
7. [Rate Limiting](#rate-limiting)
8. [Error Handling](#error-handling)
9. [Support](#support)

---

## Health Check API

### `GET /api/health`

Returns the health status of the SmartMart application, including database connectivity and uptime.

#### Request

```http
GET /api/health HTTP/1.1
Host: smartmart.com
```

No authentication required.

#### Response

```json
{
  "status": "healthy",
  "service": "smartmart",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

| Field | Type | Description |
|---|---|---|
| `status` | string | `"healthy"` or `"degraded"` |
| `service` | string | Service name (`"smartmart"`) |
| `version` | string | Application version |
| `timestamp` | string | ISO 8601 timestamp |
| `uptime` | number | Uptime in seconds |
| `database` | string | Database connection status |

#### Status Codes

| Code | Description |
|---|---|
| 200 | Service is healthy |
| 503 | Service is degraded or unhealthy |

---

## Search API

### `GET /api/search`

Search for products with spell correction, filtering, and sorting.

#### Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `q` | string | — | Search query (required) |
| `category` | string | — | Filter by category ID |
| `minPrice` | number | — | Minimum price |
| `maxPrice` | number | — | Maximum price |
| `sort` | string | `relevance` | Sort order: `relevance`, `price_asc`, `price_desc`, `newest`, `rating` |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page (max 100) |

#### Request

```http
GET /api/search?q=wireless+headphones&category=electronics&sort=price_asc&page=1&limit=20 HTTP/1.1
Host: smartmart.com
```

#### Response

```json
{
  "results": [
    {
      "id": "prod-001",
      "name": "Wireless Bluetooth Headphones",
      "slug": "wireless-bluetooth-headphones",
      "price": 299.99,
      "currency": "GHS",
      "image": "https://res.cloudinary.com/smartmart/image/upload/v1/products/headphones.jpg",
      "vendor": "AudioMax Store",
      "rating": 4.5,
      "reviewCount": 128
    }
  ],
  "total": 145,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "query": "wireless headphones",
  "correctedQuery": null
}
```

#### Spell Correction

If the query contains misspellings, the API corrects them automatically:

```json
{
  "query": "fone",
  "correctedQuery": "phone",
  "results": [...]
}
```

#### Status Codes

| Code | Description |
|---|---|
| 200 | Search results returned |
| 400 | Invalid query parameters |
| 500 | Internal server error |

---

## Payment Webhooks

All payment webhooks are implemented as Supabase Edge Functions and accept POST requests with JSON payloads.

### Paystack Webhook

#### `POST /functions/v1/paystack-webhook`

Handles Paystack payment events.

#### Headers

| Header | Description |
|---|---|
| `X-Paystack-Signature` | HMAC SHA512 signature of the payload |

#### Handled Events

| Event | Action |
|---|---|
| `charge.success` | Mark payment as success, confirm order |
| `charge.failed` | Mark payment as failed, cancel order |
| `transfer.success` | Mark transfer as success |
| `transfer.failed` | Mark transfer as failed |
| `refund.processed` | Mark payment as refunded |

#### Database Updates

On successful payment:
1. `payments` table: status → `success`
2. `transactions` table: status → `success`
3. `orders` table: payment_status → `paid`, status → `confirmed`
4. `activity_logs` table: new entry with `payment.success`

#### Response

```json
{
  "message": "Webhook processed",
  "event": "charge.success",
  "reference": "ref_xxxxxxxx",
  "status": "success"
}
```

---

### Stripe Webhook

#### `POST /functions/v1/stripe-webhook`

Handles Stripe payment events.

#### Headers

| Header | Description |
|---|---|
| `Stripe-Signature` | Stripe webhook signature |

#### Handled Events

| Event | Action |
|---|---|
| `checkout.session.completed` | Mark payment as success, confirm order |
| `charge.refunded` | Mark payment as refunded, update order |
| `checkout.session.expired` | Mark payment as expired, cancel order |

#### Response

```json
{
  "received": true,
  "type": "checkout.session.completed"
}
```

---

### Flutterwave Webhook

#### `POST /functions/v1/flutterwave-webhook`

Handles Flutterwave payment events.

#### Headers

| Header | Description |
|---|---|
| `verif-hash` | Webhook verification hash |

#### Handled Events

| Event | Action |
|---|---|
| `charge.completed` | Mark payment as success/failed based on status, confirm order |
| `refund.completed` | Mark payment as refunded, update order |

#### Response

```json
{
  "message": "Webhook processed",
  "event": "charge.completed"
}
```

---

### Hubtel Webhook

#### `POST /functions/v1/hubtel-webhook`

Handles Hubtel mobile money payment events.

#### Handled Statuses

| Status | Action |
|---|---|
| `Success` | Mark payment as success, confirm order |
| `Failed` | Mark payment as failed, cancel order |

#### Response

```json
{
  "message": "Webhook processed",
  "status": "success"
}
```

---

## Send Email Function

### `POST /functions/v1/send-email`

Sends branded transactional emails via the Resend API.

#### Request Body

```json
{
  "to": "customer@example.com",
  "template": "order_confirmation",
  "data": {
    "name": "John Doe",
    "orderId": "ORD-12345",
    "items": [
      { "name": "Wireless Headphones", "quantity": 1, "price": 299.99 }
    ],
    "total": 299.99,
    "currency": "GHS",
    "shippingAddress": "123 Main St, Accra, Ghana"
  }
}
```

#### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `to` | string | Yes | Recipient email address |
| `template` | string | Yes | Template name (see below) |
| `data` | object | No | Template-specific data |

#### Available Templates

| Template | Required Data | Description |
|---|---|---|
| `welcome` | `name` | Welcome email for new users |
| `email_verification` | `name`, `verificationUrl` | Email verification link |
| `password_reset` | `name`, `resetUrl` | Password reset link |
| `order_confirmation` | `name`, `orderId`, `items`, `total`, `currency`, `shippingAddress` | Order confirmed |
| `order_shipped` | `name`, `orderId`, `trackingNumber`, `carrier` | Order shipped with tracking |
| `order_delivered` | `name`, `orderId` | Order delivered |
| `refund_notification` | `name`, `orderId`, `refundAmount`, `currency`, `reason` | Refund processed |
| `vendor_approval` | `name`, `storeName` | Vendor application approved |
| `vendor_rejection` | `name`, `reason` | Vendor application rejected |

#### Response

```json
{
  "success": true,
  "message": "Email sent successfully",
  "template": "order_confirmation",
  "to": "customer@example.com"
}
```

#### Environment Variables

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | Sender email (`smrtmart304@gmail.com`) |

All emails include the SmartMart contact information in the footer:
- **Phone:** +233 55 162 1261
- **Email:** smrtmart304@gmail.com

#### Status Codes

| Code | Description |
|---|---|
| 200 | Email sent successfully |
| 400 | Missing required fields or unknown template |
| 405 | Method not allowed (only POST) |
| 500 | Internal server error or Resend API failure |

---

## Database Tables

### Core Tables

| Table | Description |
|---|---|
| `profiles` | User profiles (customers, vendors, admins) |
| `categories` | Product categories |
| `products` | Product listings |
| `product_images` | Images for each product |
| `orders` | Customer orders |
| `order_items` | Individual items within an order |
| `payments` | Payment records |
| `transactions` | Transaction records (payments, refunds) |
| `addresses` | User shipping addresses |
| `carts` | Shopping carts |
| `cart_items` | Items in shopping carts |
| `wishlists` | User wishlists |

### Vendor Tables

| Table | Description |
|---|---|
| `vendor_profiles` | Vendor business profiles |
| `stores` | Vendor storefronts |
| `inventory_logs` | Inventory change history |

### Engagement Tables

| Table | Description |
|---|---|
| `reviews` | Product reviews and ratings |
| `loyalty_points` | Loyalty point transactions |
| `referrals` | User referral records |
| `chat_conversations` | Live chat conversations |
| `chat_messages` | Individual chat messages |
| `support_tickets` | Customer support tickets |

### System Tables

| Table | Description |
|---|---|
| `activity_logs` | Audit log of all system actions |
| `settings` | Application settings (key-value store) |

### Key Table Schemas

#### `profiles`

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key (references auth.users) |
| `email` | text | User email |
| `full_name` | text | Full name |
| `role` | text | `customer`, `vendor`, or `admin` |
| `avatar_url` | text | Profile image URL |
| `phone` | text | Phone number |
| `created_at` | timestamptz | Account creation time |

#### `products`

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | text | Product name |
| `slug` | text | URL-friendly identifier |
| `description` | text | Product description |
| `price` | numeric | Product price |
| `currency` | text | Price currency |
| `stock` | integer | Available quantity |
| `category_id` | uuid | References categories |
| `vendor_id` | uuid | References profiles (vendor) |
| `status` | text | `active`, `draft`, `inactive` |
| `created_at` | timestamptz | Creation time |

#### `orders`

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | References profiles |
| `status` | text | `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled` |
| `payment_status` | text | `pending`, `paid`, `failed`, `refunded`, `expired` |
| `total` | numeric | Order total |
| `currency` | text | Order currency |
| `shipping_address` | text/jsonb | Shipping address |
| `payment_reference` | text | Payment gateway reference |
| `confirmed_at` | timestamptz | Confirmation time |
| `created_at` | timestamptz | Order time |

#### `payments`

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `reference` | text | Unique payment reference |
| `status` | text | `pending`, `success`, `failed`, `refunded`, `expired` |
| `amount` | numeric | Payment amount |
| `currency` | text | Payment currency |
| `gateway` | text | `paystack`, `stripe`, `flutterwave`, `hubtel` |
| `user_id` | uuid | References profiles |
| `created_at` | timestamptz | Creation time |

---

## Row Level Security (RLS) Policies

All tables have RLS enabled. Below are the key policies:

### Profiles

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### Products

```sql
-- Anyone can view active products
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (status = 'active');

-- Vendors can manage their own products
CREATE POLICY "Vendors can insert own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update own products" ON products
  FOR UPDATE USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can delete own products" ON products
  FOR DELETE USING (auth.uid() = vendor_id);
```

### Orders

```sql
-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vendors can view orders containing their products
CREATE POLICY "Vendors can view related orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = orders.id AND p.vendor_id = auth.uid()
    )
  );

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### Payments

```sql
-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### Activity Logs

```sql
-- Admins can view all activity logs
CREATE POLICY "Admins can view activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role can insert logs (for edge functions)
CREATE POLICY "Service can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);
```

---

## Rate Limiting

### API Rate Limits

| Endpoint Type | Rate Limit | Window |
|---|---|---|
| Public API (search, products) | 100 requests | per minute |
| Authenticated API | 300 requests | per minute |
| Webhook endpoints | 1000 requests | per minute |
| Email sending | 10 requests | per minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705320600
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

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": "error_type",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context about the error"
  }
}
```

### HTTP Status Codes

| Code | Description |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | No content (success) |
| 400 | Bad request — invalid input |
| 401 | Unauthorized — authentication required or failed |
| 403 | Forbidden — insufficient permissions |
| 404 | Not found |
| 405 | Method not allowed |
| 409 | Conflict — duplicate resource |
| 422 | Unprocessable entity — validation error |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable |

### Common Error Codes

| Error | Description |
|---|---|
| `INVALID_INPUT` | Request body or parameters are invalid |
| `UNAUTHORIZED` | Authentication token is missing or invalid |
| `FORBIDDEN` | User does not have permission for this action |
| `NOT_FOUND` | The requested resource does not exist |
| `CONFLICT` | The resource already exists |
| `VALIDATION_ERROR` | Input failed validation |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | An unexpected server error occurred |
| `DATABASE_ERROR` | Database operation failed |
| `PAYMENT_FAILED` | Payment processing failed |
| `EMAIL_SEND_FAILED` | Email could not be sent |

### Webhook Error Handling

Webhook endpoints return appropriate status codes to signal retry behavior:

| Status | Payment Gateway Behavior |
|---|---|
| 200 | Event processed successfully — no retry |
| 400 | Invalid payload — no retry (bad request) |
| 401 | Invalid signature — no retry (auth failure) |
| 500 | Server error — gateway will retry |

---

## Support

For API-related questions, integration support, or to report issues:

- **Phone:** +233 55 162 1261
- **Email:** smrtmart304@gmail.com

Our team can assist with API integration, webhook configuration, authentication setup, and troubleshooting.
