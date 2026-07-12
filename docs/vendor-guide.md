# SmartMart Ghana — Vendor Guide

This guide provides comprehensive instructions for vendors to set up and manage their store on the SmartMart Ghana marketplace.

---

## Table of Contents

1. [Registration](#1-registration)
2. [Store Setup](#2-store-setup)
3. [Product Management](#3-product-management)
4. [Inventory Management](#4-inventory-management)
5. [Order Fulfillment](#5-order-fulfillment)
6. [Earnings & Payouts](#6-earnings--payouts)
7. [Customer Communication](#7-customer-communication)
8. [Best Practices](#8-best-practices)

---

## 1. Registration

### Becoming a Vendor

1. **Create an Account**
   - Navigate to `https://smartmartghana.com/register`
   - Fill in your name, email, and password
   - Verify your email address

2. **Apply as a Vendor**
   - Log in to your account
   - Go to **Account → Become a Vendor**
   - Complete the vendor application form:
     - Store name
     - Store description
     - Business registration number (if applicable)
     - Phone number
     - Business address
     - Upload business documents (Ghana Card, business certificate)
   - Submit the application

3. **Application Review**
   - Applications are reviewed within 48 hours
   - You will receive an email notification when approved or rejected
   - If approved, you'll receive a welcome email with next steps
   - If rejected, the email will include the reason and instructions to reapply

### Vendor Account Types

| Type | Commission Rate | Features |
|------|----------------|----------|
| Standard Vendor | 10% | Basic store, product listings, order management |
| Premium Vendor | 7% | Featured placement, priority support, analytics |
| Enterprise Vendor | 5% | API access, bulk operations, dedicated support |

---

## 2. Store Setup

After your vendor application is approved, set up your store.

### Store Profile

Access at **Vendor Dashboard → Store Settings**:

| Setting | Description | Tips |
|---------|-------------|------|
| Store Name | Your store's display name | Use a memorable, professional name |
| Store Slug | URL-friendly identifier | Auto-generated from store name |
| Description | Store description (max 500 chars) | Highlight what makes your store unique |
| Logo | Store logo image | 512x512px recommended, max 2MB |
| Banner | Store banner image | 1200x400px recommended, max 5MB |
| Contact Phone | Customer service phone | Include country code (+233) |
| Contact Email | Customer service email | Check regularly |
| Location | City and region | Helps with local search |
| Social Links | Facebook, Instagram, Twitter | Build your brand presence |

### Store URL

Your store will be accessible at:
```
https://smartmartghana.com/store/{your-store-slug}
```

### Store Status

- **Active**: Store is live and products are visible to customers
- **Paused**: Store is temporarily hidden (you can pause anytime)
- **Suspended**: Admin has suspended the store (contact support)

### Shipping Configuration

Configure your shipping options at **Vendor Dashboard → Shipping**:

- **Shipping Zones**: Define regions you ship to (Accra, Kumasi, Takoradi, nationwide)
- **Flat Rate Shipping**: Set a flat shipping fee per zone
- **Free Shipping Threshold**: Offer free shipping above a certain order amount
- **Processing Time**: How long it takes to prepare an order (1-2 days, 3-5 days)
- **Local Pickup**: Offer in-store pickup option

### Payout Configuration

Set up your payout method at **Vendor Dashboard → Payouts → Settings**:

- **Payout Method**: Mobile Money or Bank Transfer
- **Mobile Money Number**: MTN, Vodafone, or AirtelTigo
- **Bank Account**: Bank name, account number, account name
- **Payout Schedule**: Weekly (every Monday) or Monthly (1st of each month)
- **Minimum Payout Amount**: Minimum balance required for payout (default: GHS 50)

---

## 3. Product Management

### Adding a Product

1. Navigate to **Vendor Dashboard → Products → Add New**
2. Fill in the product details:

### Product Information

| Field | Description | Requirements |
|-------|-------------|--------------|
| Product Name | Display name | 3-200 characters, unique |
| Slug | URL identifier | Auto-generated, editable |
| Description | Full product description | Min 50 characters, supports HTML |
| Short Description | Brief summary | Max 300 characters |
| Category | Primary category | Select from available categories |
| Subcategory | Optional subcategory | For better organization |
| Brand | Product brand | Optional |
| SKU | Stock keeping unit | Unique per product |
| Barcode | Product barcode | Optional |

### Pricing

| Field | Description |
|---------|-------------|
| Regular Price | Standard selling price (GHS) |
| Sale Price | Discounted price (optional) |
| Sale Start Date | When sale price takes effect |
| Sale End Date | When sale price expires |
| Tax Inclusive | Whether price includes VAT |

### Inventory

| Field | Description |
|---------|-------------|
| Stock Quantity | Available units |
| Low Stock Threshold | Alert when stock falls below this |
| Track Inventory | Enable/disable stock tracking |
| Allow Backorder | Allow purchase when out of stock |

### Images

- Upload up to 8 images per product
- First image is the primary/thumbnail image
- Supported formats: JPG, PNG, WebP
- Maximum file size: 10MB per image
- Recommended size: 1000x1000px minimum
- Images are automatically optimized via Cloudinary

### Variants

If your product has variants (e.g., different sizes, colors):

1. Enable **Product Variants**
2. Define variant attributes (e.g., Size: S, M, L, XL)
3. Set price, stock, and SKU for each variant
4. Upload variant-specific images (optional)

### Product Status

| Status | Description |
|--------|-------------|
| Draft | Not visible to customers |
| Pending Review | Submitted for admin approval |
| Active | Visible and purchasable |
| Inactive | Temporarily hidden |
| Rejected | Admin rejected (see reason) |

> **Note**: New products may require admin approval before going live, depending on platform settings.

### Editing Products

- Go to **Vendor Dashboard → Products**
- Click on any product to edit
- Changes to active products may require re-approval
- Price and stock changes take effect immediately

### Bulk Product Management

- **Import Products**: Upload a CSV file to create multiple products at once
- **Export Products**: Download all products as CSV
- **Bulk Edit**: Select multiple products to update status, category, or pricing

---

## 4. Inventory Management

### Tracking Stock

Access inventory at **Vendor Dashboard → Inventory**:

- View current stock levels for all products
- See products with low stock (below threshold)
- See out-of-stock products
- View inventory change history

### Stock Adjustments

Manually adjust stock levels:

1. Go to **Vendor Dashboard → Inventory → Adjust**
2. Select the product
3. Choose adjustment type:
   - **Restock**: Add inventory (new shipment received)
   - **Remove**: Subtract inventory (damaged, lost)
   - **Set**: Set exact stock level (physical count)
4. Enter the quantity change
5. Add a reason/note
6. Submit the adjustment

All stock changes are logged in the `inventory_logs` table with:
- Previous stock level
- New stock level
- Quantity change
- Reason
- Timestamp

### Automatic Stock Updates

Stock is automatically reduced when:
- An order is placed and confirmed
- A customer completes checkout

Stock is automatically restored when:
- An order is cancelled
- A return is processed

### Low Stock Alerts

- When stock falls below the low stock threshold, you receive:
  - An email notification
  - A dashboard alert
  - A notification badge in the vendor dashboard

### Inventory Best Practices

- Set realistic low stock thresholds
- Restock before running out of stock
- Conduct regular physical inventory counts
- Use the inventory log to audit stock changes
- Remove or mark inactive products you no longer sell

---

## 5. Order Fulfillment

### Viewing Orders

Access orders at **Vendor Dashboard → Orders**:

- View all orders containing your products
- Filter by status (pending, confirmed, processing, shipped, delivered, cancelled)
- Filter by date range
- Search by order number or customer name
- See order priority and shipping method

### Order Fulfillment Workflow

1. **New Order** — Customer places an order
   - You receive an email notification
   - Order appears in your dashboard as "Pending"

2. **Confirm Order** — Review and accept the order
   - Check stock availability
   - Verify shipping address
   - Click **Confirm** to accept
   - If you cannot fulfill, click **Decline** with a reason

3. **Process Order** — Prepare the items
   - Gather products from inventory
   - Package securely
   - Update status to "Processing"

4. **Ship Order** — Dispatch the package
   - Select the shipping carrier
   - Enter the tracking number
   - Update status to "Shipped"
   - Customer receives a shipping notification email

5. **Delivery** — Package is delivered
   - Carrier updates delivery status
   - Order status changes to "Delivered"
   - Customer receives a delivery notification email

6. **Post-Delivery**
   - Customer can leave a review
   - Earnings are added to your payout balance
   - Order is marked as complete after the return window (7 days)

### Order Details

Each order detail page shows:
- Order number and date
- Customer name and shipping address
- Items ordered (your products only)
- Quantities and prices
- Shipping method and tracking number
- Payment status
- Customer notes/instructions
- Order timeline

### Handling Cancellations

- **Customer-initiated**: Customer cancels before shipping — approve or decline
- **Vendor-initiated**: You cancel due to stock issues — provide a reason
- **Auto-cancel**: System cancels if not confirmed within 48 hours

### Returns & Refunds

1. Customer requests a return within 7 days of delivery
2. You receive a return request notification
3. Review the request and customer's reason
4. Approve or decline the return
5. If approved, provide return shipping instructions
6. Receive and inspect the returned item
7. Process the refund through the platform
8. Stock is automatically restored

---

## 6. Earnings & Payouts

### Understanding Earnings

Access earnings at **Vendor Dashboard → Earnings**:

- **Gross Sales**: Total value of all orders
- **Commission**: Platform commission deducted (e.g., 10%)
- **Shipping Revenue**: Shipping fees collected from customers
- **Refunds**: Amount refunded to customers
- **Net Earnings**: Gross sales - commission - refunds
- **Available for Payout**: Net earnings ready for withdrawal
- **Pending Clearance**: Earnings awaiting order completion (7-day hold)

### Earnings Breakdown

| Component | Description |
|-----------|-------------|
| Product Revenue | Sum of product prices × quantities sold |
| Commission | Platform fee (percentage of product revenue) |
| Shipping | Shipping fees collected from customers |
| Refunds | Refunded amounts (deducted from earnings) |
| Net Earnings | Product Revenue - Commission - Refunds |

### Payout Schedule

- **Weekly Payouts**: Every Monday (for earnings cleared by Sunday)
- **Monthly Payouts**: 1st of each month (for previous month's cleared earnings)
- **Minimum Payout**: GHS 50 (balances below this carry over to next cycle)
- **Processing Time**: 1-3 business days for Mobile Money, 3-5 for bank transfer

### Payout History

View all past payouts at **Vendor Dashboard → Payouts → History**:

- Payout date
- Amount
- Method (Mobile Money / Bank Transfer)
- Status (pending, processed, failed)
- Reference number

### Tax Information

- Vendors are responsible for their own tax filings
- Download monthly earnings statements for tax purposes
- The platform deducts VAT at checkout (passed to the government)
- Commission is inclusive of applicable taxes

---

## 7. Customer Communication

### Live Chat

Access chat at **Vendor Dashboard → Messages**:

- View all customer conversations
- See unread message count
- Filter by status (active, closed)
- Search by customer name or product

### Responding to Customers

1. Click on a conversation to view messages
2. Type your response in the message box
3. Attach images if needed (product photos, shipping proof)
4. Send the message
5. Customer receives a notification

### Chat Best Practices

- Respond within 24 hours
- Be professional and courteous
- Answer product questions thoroughly
- Provide order status updates proactively
- Resolve disputes amicably
- Keep conversations on the platform (for your protection)

### Product Inquiries

Customers may ask about:
- Product availability and stock
- Product specifications and features
- Shipping costs and delivery times
- Bulk/wholesale pricing
- Custom orders

### Order Communication

Proactively communicate about:
- Order confirmation
- Processing delays
- Shipping notifications
- Delivery issues
- Return processing

---

## 8. Best Practices

### Store Optimization

- **Use high-quality images**: Clear, well-lit product photos increase sales
- **Write detailed descriptions**: Include specifications, materials, dimensions
- **Set competitive prices**: Research competitors on the platform
- **Offer sales and discounts**: Use sale prices to attract customers
- **Keep stock updated**: Avoid overselling by maintaining accurate inventory
- **Respond quickly**: Fast response times improve customer satisfaction
- **Maintain good ratings**: Encourage satisfied customers to leave reviews

### Growing Your Business

- **Feature your best products**: Use the featured product option
- **Cross-sell**: Suggest related products in descriptions
- **Bundle products**: Offer product bundles at a discount
- **Run promotions**: Time sales with holidays and events
- **Build your brand**: Consistent logo, banner, and product styling
- **Leverage social media**: Link your social accounts to your store
- **Analyze performance**: Use vendor analytics to identify trends

### Customer Service

- **Be responsive**: Reply to messages within 24 hours
- **Be honest**: Accurate product descriptions prevent returns
- **Package carefully**: Secure packaging reduces damage claims
- **Ship promptly**: Fast processing leads to positive reviews
- **Handle returns gracefully**: Easy returns build customer trust
- **Follow up**: Check in after delivery to ensure satisfaction

### Compliance

- **Only sell authentic products**: Counterfeit goods are strictly prohibited
- **Follow Ghanaian regulations**: Ensure products meet local standards
- **Respect intellectual property**: Don't sell trademarked items without authorization
- **Honor your listings**: Fulfill orders at the listed price
- **Maintain accurate business info**: Keep your registration documents current

### Performance Metrics

Monitor these key metrics in your dashboard:

| Metric | Target |
|--------|--------|
| Order Confirmation Time | < 24 hours |
| Order Processing Time | < 48 hours |
| Response Time | < 24 hours |
| Order Cancellation Rate | < 5% |
| Return Rate | < 10% |
| Customer Rating | > 4.0 / 5.0 |

Vendors consistently meeting these targets may qualify for Premium or Enterprise vendor status with lower commission rates.
