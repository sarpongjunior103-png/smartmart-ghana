# SmartMart Ghana — Admin Guide

This guide provides comprehensive instructions for platform administrators to manage the SmartMart Ghana marketplace.

---

## Table of Contents

1. [Accessing the Admin Dashboard](#1-accessing-the-admin-dashboard)
2. [Platform Settings](#2-platform-settings)
3. [User Management](#3-user-management)
4. [Product Management](#4-product-management)
5. [Order Management](#5-order-management)
6. [Analytics & Reporting](#6-analytics--reporting)
7. [Audit Logs](#7-audit-logs)
8. [Support Tickets](#8-support-tickets)

---

## 1. Accessing the Admin Dashboard

### Prerequisites

- You must have an account with the `admin` role assigned.
- Your account must be active and email-verified.

### Logging In

1. Navigate to `https://smartmartghana.com/admin/login`.
2. Enter your admin email and password.
3. Complete two-factor authentication if enabled.
4. You will be redirected to the admin dashboard at `/admin`.

### Admin Dashboard Overview

The dashboard provides a high-level summary of:
- Total revenue (today, this week, this month)
- Number of orders (pending, processing, completed)
- Active vendors and pending vendor applications
- Total registered customers
- Recent activity feed
- Platform health indicators

---

## 2. Platform Settings

Access platform settings at **Admin → Settings**. Settings are organized into six tabs.

### General Settings

Configure basic platform information:

| Setting | Description | Example |
|---------|-------------|---------|
| Site Name | Platform display name | SmartMart Ghana |
| Support Email | Customer support email | support@smartmartghana.com |
| Support Phone | Customer support phone | +233 30 000 0000 |
| Default Language | Platform default language | English |
| Default Currency | Default transaction currency | GHS |
| Timezone | Platform timezone | Africa/Accra |
| Maintenance Mode | Toggle platform maintenance | Off |

### Payment Settings

Configure payment gateway options:

- **Enabled Gateways**: Toggle Paystack, Stripe, Flutterwave, Hubtel
- **Default Gateway**: Set the primary payment method
- **Mobile Money**: Enable MTN MoMo, Vodafone Cash, AirtelTigo Money
- **Card Payments**: Enable/disable card payments
- **Bank Transfer**: Enable bank transfer option
- **Minimum Order Amount**: Minimum transaction amount
- **Maximum Order Amount**: Maximum transaction amount
- **Auto-confirm Payments**: Automatically confirm successful payments

### Shipping Settings

Configure shipping and delivery:

- **Default Carrier**: Ghana Post, DHL, FedEx, Aramex
- **Free Shipping Threshold**: Minimum order amount for free shipping
- **Standard Shipping Rate**: Flat rate for standard delivery
- **Express Shipping Rate**: Flat rate for express delivery
- **Delivery Zones**: Configure zones (Accra, Kumasi, Takoradi, Other)
- **Zone-based Rates**: Custom rates per delivery zone
- **Estimated Delivery Days**: Standard (3-5), Express (1-2)
- **International Shipping**: Enable/disable international delivery

### Tax Settings

Configure tax and VAT:

- **VAT Rate**: Ghana standard VAT rate (default: 15%)
- **NHIL Rate**: National Health Insurance Levy (2.5%)
- **GETFL Rate**: Ghana Education Trust Fund Levy (2.5%)
- **Tax Inclusive**: Prices include tax (Yes/No)
- **Tax-exempt Categories**: Categories exempt from tax
- **Digital Products Tax**: Tax rate for digital goods

### Notification Settings

Configure platform notifications:

- **Email Notifications**: Enable/disable transactional emails
- **SMS Notifications**: Enable/disable SMS alerts
- **New Order Alert**: Notify admin on new orders
- **Vendor Application Alert**: Notify admin on new vendor applications
- **Low Stock Alert**: Notify vendors when stock is low
- **Refund Alert**: Notify admin on refund requests
- **Support Ticket Alert**: Notify admin on new support tickets
- **Daily Summary**: Daily email summary of platform activity

### Security Settings

Configure security policies:

- **Two-Factor Authentication**: Require 2FA for admin accounts
- **Password Policy**: Minimum length, complexity requirements
- **Session Timeout**: Auto-logout after inactivity (minutes)
- **Rate Limiting**: API request limits per user
- **IP Whitelist**: Restrict admin access to specific IPs
- **Failed Login Limit**: Max failed attempts before lockout
- **Account Verification**: Require email verification for new accounts
- **Vendor Verification**: Require document upload for vendor applications

---

## 3. User Management

Access user management at **Admin → Users**.

### Viewing Users

- View all registered users (customers, vendors, admins)
- Filter by role (customer, vendor, admin)
- Filter by status (active, suspended, banned)
- Search by name, email, or phone
- Sort by registration date, last login, name

### User Actions

- **View Profile**: See full user details and activity
- **Edit Role**: Change user role (customer ↔ vendor ↔ admin)
- **Suspend Account**: Temporarily disable a user account
- **Ban Account**: Permanently ban a user
- **Reset Password**: Send password reset email
- **Delete Account**: Permanently remove a user (use with caution)
- **Impersonate**: Temporarily log in as the user (for support)

### Managing Vendors

- **Review Applications**: View pending vendor applications
- **Approve/Reject**: Approve or reject vendor applications
- **Set Commission Rate**: Configure commission per vendor
- **Suspend Vendor**: Temporarily suspend a vendor's store
- **View Store**: Visit the vendor's store page
- **View Payouts**: Review vendor payout history
- **Adjust Balance**: Manually adjust vendor payout balance

### Bulk Operations

- Export user list as CSV
- Send bulk email to filtered users
- Bulk suspend/activate accounts
- Bulk assign roles

---

## 4. Product Management

Access product management at **Admin → Products**.

### Viewing Products

- View all products across all vendors
- Filter by vendor, category, status
- Filter by approval status (approved, pending, rejected)
- Search by name, SKU, or description
- Sort by price, date, stock level

### Product Actions

- **View Product**: See full product details
- **Edit Product**: Modify any product field (override vendor)
- **Approve Product**: Approve pending products
- **Reject Product**: Reject with reason
- **Feature Product**: Highlight on homepage
- **Unfeature Product**: Remove from featured
- **Delete Product**: Remove a product from the platform
- **Flag Product**: Flag for review (counterfeit, inappropriate)

### Category Management

Access at **Admin → Products → Categories**:

- **Create Category**: Add new product categories
- **Edit Category**: Modify name, slug, description, image
- **Delete Category**: Remove (reassign products first)
- **Reorder Categories**: Set display order
- **Create Subcategory**: Add nested categories
- **Set Category Image**: Upload category thumbnail

### Product Moderation

- Review flagged products
- Check for counterfeit listings
- Verify product images match descriptions
- Ensure pricing is reasonable
- Check for prohibited items

---

## 5. Order Management

Access order management at **Admin → Orders**.

### Viewing Orders

- View all orders across the platform
- Filter by status (pending, confirmed, processing, shipped, delivered, cancelled, refunded)
- Filter by payment status (pending, success, failed, refunded)
- Filter by date range
- Search by order number, customer name, or email
- Sort by date, total amount, status

### Order Actions

- **View Order**: See full order details (items, customer, shipping, payment)
- **Update Status**: Change order status manually
- **Issue Refund**: Process full or partial refund
- **Cancel Order**: Cancel an order with reason
- **Print Invoice**: Generate printable invoice
- **Export Orders**: Download as CSV
- **Contact Customer**: Send email to customer
- **Contact Vendor**: Send email to the vendor

### Order Details View

Each order detail page shows:
- Order number and date
- Customer information (name, email, phone, address)
- Vendor information for each item
- Items ordered (name, quantity, price, subtotal)
- Payment details (gateway, reference, amount, status)
- Shipping details (carrier, tracking number, status)
- Order timeline (all status changes with timestamps)
- Activity logs related to the order

### Handling Disputes

1. Review the order details and communication history
2. Contact both customer and vendor
3. Determine the appropriate resolution
4. Process refund if necessary
5. Update order status
6. Log the resolution in activity logs

---

## 6. Analytics & Reporting

Access analytics at **Admin → Analytics**.

### Dashboard Metrics

- **Revenue**: Total, daily, weekly, monthly, yearly
- **Orders**: Count, average order value, conversion rate
- **Customers**: New registrations, active users, retention
- **Vendors**: Active vendors, new applications, top performers
- **Products**: Total listings, approved, pending, out of stock

### Revenue Reports

- Revenue by date range
- Revenue by payment gateway
- Revenue by category
- Revenue by vendor
- Commission earned
- Refund totals

### Sales Reports

- Top-selling products
- Top vendors by sales
- Top categories by revenue
- Sales by region/city
- Sales trends over time

### Customer Analytics

- Customer growth chart
- Repeat purchase rate
- Average customer lifetime value
- Customer acquisition sources
- Loyalty program participation

### Exporting Reports

All reports can be exported as:
- CSV (for spreadsheet analysis)
- PDF (for presentations)
- JSON (for API integration)

---

## 7. Audit Logs

Access audit logs at **Admin → Audit Logs**.

### What is Logged

The `activity_logs` table records:
- User authentication events (login, logout, failed attempts)
- Admin actions (user role changes, product approvals, settings changes)
- Order status changes
- Payment events (success, failure, refund)
- Vendor application approvals/rejections
- Product creation, updates, deletions
- System configuration changes

### Viewing Logs

- Filter by user (admin, vendor, customer, system)
- Filter by action type
- Filter by entity type (order, product, payment, user)
- Filter by date range
- Search by keyword
- Export as CSV

### Log Entry Fields

| Field | Description |
|-------|-------------|
| Timestamp | When the action occurred |
| User | Who performed the action |
| Action | What was done (e.g., `payment_success`, `product_approved`) |
| Entity Type | What was affected (e.g., `order`, `product`, `user`) |
| Entity ID | Specific record ID |
| Details | Additional context (JSON) |
| IP Address | Request IP address |

### Compliance

- Logs are retained indefinitely
- Logs cannot be deleted by admins
- Only super admins can access export functionality
- All admin actions are logged automatically

---

## 8. Support Tickets

Access support tickets at **Admin → Support**.

### Ticket Queue

- View all support tickets
- Filter by status (open, in progress, resolved, closed)
- Filter by priority (low, medium, high, urgent)
- Filter by category (order issue, payment, account, product, other)
- Sort by date, priority, status

### Managing Tickets

- **Assign Ticket**: Assign to a specific admin
- **Respond**: Reply to the customer
- **Change Priority**: Update ticket priority
- **Change Status**: Update ticket status
- **Add Internal Note**: Add private notes (not visible to customer)
- **Escalate**: Escalate to senior admin
- **Close Ticket**: Mark as resolved and close
- **Reopen**: Reopen a closed ticket

### Ticket Workflow

1. Customer creates a ticket from the help center
2. Ticket appears in the admin queue
3. Admin assigns the ticket
4. Admin responds or requests more information
5. Issue is resolved
6. Admin closes the ticket
7. Customer can reopen if needed

### Common Support Scenarios

#### Payment Issues
1. Verify payment status in the payments table
2. Check the payment gateway dashboard
3. If payment succeeded but order is pending, manually confirm
4. If payment failed, advise customer to retry
5. Process refund if payment was duplicate

#### Order Not Received
1. Check shipping status and tracking number
2. Contact the vendor for fulfillment status
3. Contact the shipping carrier
4. Arrange redelivery or refund as appropriate

#### Vendor Disputes
1. Review the order and communication history
2. Contact both parties
3. Review evidence (photos, messages)
4. Make a determination
5. Process refund or resolution
6. Document the outcome

#### Account Access
1. Verify the user's identity
2. Reset password if needed
3. Unlock account if suspended by mistake
4. Enable 2FA if account was compromised

---

## Best Practices

- **Review vendor applications within 48 hours** to maintain vendor satisfaction
- **Monitor refund rates** — high rates may indicate product quality issues
- **Check audit logs weekly** for any unauthorized access attempts
- **Update platform settings** as business requirements change
- **Respond to support tickets within 24 hours** for high-priority items
- **Review analytics monthly** to identify trends and opportunities
- **Backup database before major changes** to platform settings
- **Test payment flows after gateway configuration changes**
