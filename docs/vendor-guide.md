# Vendor Guide

Welcome to SmartMart! This guide walks vendors through everything from registration to running a successful store — setting up your shop, managing products, fulfilling orders, tracking earnings, and communicating with customers.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Vendor Registration](#vendor-registration)
3. [Store Setup](#store-setup)
4. [Product Management](#product-management)
5. [Inventory Management](#inventory-management)
6. [Order Fulfillment](#order-fulfillment)
7. [Earnings & Payouts](#earnings--payouts)
8. [Customer Communication](#customer-communication)
9. [Best Practices](#best-practices)
10. [Support](#support)

---

## Getting Started

SmartMart is a multi-vendor marketplace where independent sellers can list products, manage inventory, fulfill orders, and earn revenue. As a vendor, you get:

- A customizable storefront
- Product listing and inventory management tools
- Order management dashboard
- Automated payout tracking
- Direct customer communication via live chat
- Analytics and sales reports

---

## Vendor Registration

### Step 1: Create an Account

1. Go to [smartmart.com/register](https://smartmart.com/register).
2. Enter your email address, full name, and password.
3. Verify your email address by clicking the link sent to your inbox.

### Step 2: Apply as a Vendor

1. After signing in, go to **Become a Vendor**.
2. Fill out the vendor application form:
   - **Business Name**: Your store's public name
   - **Business Email**: Contact email for your store
   - **Business Phone**: Contact phone number
   - **Business Address**: Physical business location
   - **Business Description**: Brief description of what you sell
   - **Categories**: Product categories you plan to sell
3. Submit the application for review.

### Step 3: Application Review

- Our admin team reviews applications within **2-3 business days**.
- You'll receive an email notification when your application is approved or rejected.
- If approved, you'll get access to the **Vendor Dashboard**.
- If rejected, the email will include the reason and guidance on how to reapply.

> **Need help with your application?** Contact us at **+233 55 162 1261** or **smartmart304@gmail.com**.

---

## Store Setup

### Store Profile

After approval, configure your store:

1. Go to **Vendor Dashboard → Store Settings**.
2. Set up the following:

| Setting | Description |
|---|---|
| Store Name | Display name for your storefront |
| Store Slug | URL-friendly identifier (e.g., `my-store`) |
| Store Description | Shown on your storefront page |
| Store Logo | Upload via Cloudinary (recommended 400x400px) |
| Store Banner | Wide image for your storefront header (recommended 1200x300px) |
| Contact Email | Email visible to customers |
| Contact Phone | Phone visible to customers |
| Social Links | Facebook, Instagram, Twitter, WhatsApp |

### Store Policies

Configure your store policies:
- **Return Policy**: How many days customers have to return items
- **Shipping Policy**: Expected processing and delivery times
- **FAQ**: Common questions about your products

### Payout Settings

1. Go to **Vendor Dashboard → Payout Settings**.
2. Add your bank account or mobile money details.
3. Choose your payout schedule (weekly, bi-weekly, or monthly).
4. Verify your payout details with a test transaction.

---

## Product Management

### Adding a Product

1. Go to **Vendor Dashboard → Products → Add New**.
2. Fill in the product details:

| Field | Description |
|---|---|
| Product Name | Clear, descriptive title |
| Slug | Auto-generated from name (editable) |
| Description | Detailed product description (supports rich text) |
| Category | Select the most relevant category |
| Price | Price in the store's default currency |
| Compare-at Price | Original price for showing discounts (optional) |
| SKU | Stock keeping unit (optional) |
| Stock Quantity | Available inventory count |
| Weight | Product weight (for shipping calculations) |
| Images | Upload 1-8 product images via Cloudinary |
| Status | Active, Draft, or Inactive |

3. Click **Publish** to make the product visible to customers.

### Editing a Product

1. Go to **Vendor Dashboard → Products**.
2. Click the product you want to edit.
3. Make your changes and click **Save**.

### Product Images

- Upload high-quality images (minimum 800x800px).
- The first image is the primary/thumbnail image.
- Use a white or neutral background.
- Show the product from multiple angles.
- Images are automatically optimized via Cloudinary (auto format, auto quality).

### Product Statuses

| Status | Visibility |
|---|---|
| Active | Visible to customers, can be purchased |
| Draft | Not visible to customers, saved for later |
| Inactive | Not visible to customers |
| Out of Stock | Visible but cannot be purchased |

### Bulk Operations

- Use the product list to select multiple products.
- Bulk actions: activate, deactivate, delete, or update pricing.
- Import products via CSV (available for established vendors).

---

## Inventory Management

### Tracking Stock

- Stock levels are automatically updated when orders are placed.
- View current stock levels in **Vendor Dashboard → Inventory**.
- Set low-stock alerts to be notified when inventory falls below a threshold.

### Inventory Logs

Every stock change is logged in the `inventory_logs` table:

| Change Type | Description |
|---|---|
| `restock` | Inventory added |
| `sale` | Inventory reduced by a customer order |
| `adjustment` | Manual stock correction |
| `return` | Inventory restored from a returned order |
| `damage` | Inventory removed due to damage |

### Restocking

1. Go to **Vendor Dashboard → Inventory**.
2. Find the product and click **Restock**.
3. Enter the quantity added and reason.
4. The inventory log is updated automatically.

### Low Stock Alerts

- Configure alerts in **Store Settings → Notifications**.
- Receive email notifications when stock falls below your threshold.
- Set per-product thresholds for accurate alerts.

---

## Order Fulfillment

### Order Pipeline

Orders flow through the following statuses:

```
pending → confirmed → processing → shipped → delivered
```

### Processing Orders

1. Go to **Vendor Dashboard → Orders**.
2. Review new orders in the `pending` or `confirmed` status.
3. For each order:
   - Verify the payment status is `paid`.
   - Check the shipping address and customer notes.
   - Confirm stock availability.
   - Update the status to `processing`.

### Shipping Orders

1. When the order is packed and ready, update the status to `shipped`.
2. Enter the carrier and tracking number.
3. The customer is automatically notified via email with tracking details.

### Delivery Confirmation

- Orders are marked `delivered` when the carrier confirms delivery.
- In some cases, you may need to manually mark an order as delivered.
- Customers can leave reviews after delivery.

### Handling Cancellations

- Customers can request cancellations before shipping.
- Review cancellation requests promptly.
- If you cancel an order, the customer is automatically refunded.
- Log the reason for cancellation.

### Order Timeline

Each order has a complete timeline showing:
- Order placement time
- Payment confirmation time
- Processing start time
- Shipping time and tracking number
- Delivery confirmation time

---

## Earnings & Payouts

### Understanding Your Earnings

Your earnings are calculated as:

```
Earnings = Order Total - Platform Commission - Payment Processing Fee
```

- **Platform Commission**: A percentage of each sale (set by admin, typically 5-15%).
- **Payment Processing Fee**: Charged by the payment gateway (varies by gateway).

### Viewing Earnings

1. Go to **Vendor Dashboard → Earnings**.
2. View:
   - **Total Earnings**: All-time earnings
   - **Pending Payouts**: Earnings awaiting payout
   - **Completed Payouts**: Earnings already paid out
   - **This Month**: Current month's earnings
3. Filter by date range, order, or product.

### Payout Schedule

Payouts are processed based on your selected schedule:

| Schedule | Payout Day |
|---|---|
| Weekly | Every Monday |
| Bi-weekly | 1st and 15th of each month |
| Monthly | 1st of each month |

### Payout Requirements

- Minimum payout amount: GHS 50 (or equivalent)
- Bank account or mobile money must be verified
- No pending disputes or chargebacks

### Payout History

- View all past payouts in **Vendor Dashboard → Payouts**.
- Download payout statements as PDF.
- Reconcile with your bank statements.

---

## Customer Communication

### Live Chat

SmartMart includes a built-in chat system for vendor-customer communication.

1. Go to **Vendor Dashboard → Messages**.
2. View all active conversations.
3. Respond to customer inquiries about:
   - Product details
   - Order status
   - Shipping questions
   - Returns and exchanges

### Chat Best Practices

- Respond to messages within **24 hours**.
- Be professional and courteous.
- Provide accurate information about products and shipping.
- Don't share personal contact information unless necessary.
- Use the chat system for all customer communication (it's logged for your protection).

### Handling Disputes

If a customer opens a dispute:
1. Review the order details and chat history.
2. Respond promptly with a clear explanation.
3. Offer a fair resolution (refund, exchange, or replacement).
4. If you can't resolve it, escalate to SmartMart admin support.

---

## Best Practices

### Product Listings

- Write clear, accurate product titles and descriptions.
- Use high-quality images with good lighting.
- Set competitive prices — research similar products.
- Keep your inventory up to date to avoid overselling.
- Use relevant keywords in descriptions for better search visibility.

### Order Fulfillment

- Process orders within **24-48 hours** of confirmation.
- Pack items carefully to prevent damage during shipping.
- Always provide accurate tracking numbers.
- Communicate proactively about any delays.

### Customer Service

- Respond to messages and reviews promptly.
- Address complaints professionally.
- Honor your return policy.
- Build a positive reputation through good service.

### Store Performance

- Monitor your store analytics regularly.
- Identify your best-selling products and keep them in stock.
- Analyze customer reviews for improvement opportunities.
- Run promotions and discounts to boost sales.
- Keep your store profile and policies up to date.

### Compliance

- Only sell products you are authorized to sell.
- Comply with all local laws and regulations.
- Don't list prohibited items (weapons, drugs, counterfeit goods).
- Accurately represent your products.
- Respect intellectual property rights.

---

## Support

If you need help with your vendor account, store setup, or any issues, our support team is here to help:

- **Phone:** +233 55 162 1261
- **Email:** smartmart304@gmail.com

We're committed to helping our vendors succeed. Don't hesitate to reach out with questions about products, orders, payouts, or platform features.
