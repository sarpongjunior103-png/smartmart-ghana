# Admin Guide

This guide covers everything administrators need to manage SmartMart — from the dashboard to user management, product oversight, order fulfillment, analytics, and security.

---

## Table of Contents

1. [Accessing the Admin Panel](#accessing-the-admin-panel)
2. [Dashboard Overview](#dashboard-overview)
3. [Settings Management](#settings-management)
4. [User Management](#user-management)
5. [Product Management](#product-management)
6. [Order Management](#order-management)
7. [Vendor Management](#vendor-management)
8. [Analytics & Reports](#analytics--reports)
9. [Audit Logs](#audit-logs)
10. [Support Tickets](#support-tickets)
11. [Security Best Practices](#security-best-practices)
12. [Support](#support)

---

## Accessing the Admin Panel

1. Navigate to `https://smartmart.com/admin`.
2. Sign in with your admin credentials.
3. If Two-Factor Authentication (2FA) is enabled, enter the code from your authenticator app.

> **Note:** Only users with the `admin` role can access the admin panel. Assign the admin role in the Supabase dashboard or via the user management interface.

---

## Dashboard Overview

The admin dashboard provides a high-level summary of your store's performance.

### Key Metrics

| Metric | Description |
|---|---|
| Total Revenue | Sum of all completed orders |
| Order Count | Total number of orders |
| Active Users | Users who logged in within the last 30 days |
| Total Products | Number of active products |
| Pending Vendors | Vendor applications awaiting review |
| Open Support Tickets | Unresolved customer support tickets |

### Recent Activity

The dashboard shows the latest entries from the `activity_logs` table, including:
- New orders
- Payment events
- Vendor registrations
- System actions

### Charts

- **Revenue Over Time**: Daily/weekly/monthly revenue trends
- **Top Products**: Best-selling products by quantity
- **Top Categories**: Most popular product categories
- **Order Status Breakdown**: Pending, confirmed, shipped, delivered, cancelled

---

## Settings Management

The admin settings page has **6 tabs**:

### 1. General Settings

| Setting | Description |
|---|---|
| Store Name | Public name displayed across the site |
| Store Email | Primary contact email (`smrtmart304@gmail.com`) |
| Store Phone | Primary contact phone (`+233 55 162 1261`) |
| Store Address | Physical store address |
| Country | Operating country (affects currency and shipping) |
| Currency | Default transaction currency |
| Timezone | Used for timestamps and reports |
| Store Logo | URL to the store logo image |
| Store Description | SEO meta description |

### 2. Payment Settings

Toggle and configure each payment gateway:

- **Paystack**: Public key + secret key
- **Stripe**: Public key + secret key
- **Flutterwave**: Public key + secret key
- **Hubtel**: Client ID + client secret
- **Cash on Delivery**: Enable/disable

### 3. Shipping Settings

- **Free Shipping**: Enable and set minimum order threshold
- **Flat Rate Shipping**: Standard shipping rate
- **Local Pickup**: Enable and set pickup fee
- **International Shipping**: Enable and set international rate
- **Shipping Origin Address**: Where orders ship from

### 4. Tax Settings

- **Enable Tax Collection**: Toggle automatic tax calculation
- **Default Tax Rate (%)**: Percentage applied to all orders
- **Tax Inclusive**: Whether prices include tax
- **Tax by State/Region**: Location-based tax rates
- **Default Tax Class**: Standard, reduced, zero, or exempt

### 5. Notification Settings

Toggle email, SMS, and push notifications:
- Order confirmation emails
- Order shipped emails
- Order delivered emails
- Refund notification emails
- Vendor approval emails
- Vendor rejection emails

### 6. Security Settings

- **Two-Factor Authentication**: Require 2FA for admin/vendor accounts
- **IP Whitelist**: Restrict admin access to specific IPs
- **Session Timeout**: Auto-logout after inactivity (minutes)
- **Password Policies**: Minimum length, uppercase, numbers, symbols

#### ⚠️ Danger Zone

- **Maintenance Mode**: Takes the storefront offline with a custom message
- **Maintenance Message**: Text displayed to visitors during maintenance

---

## User Management

### Viewing Users

1. Go to **Admin → Users**.
2. Filter by role (customer, vendor, admin), status, or registration date.
3. Search by name or email.

### User Actions

| Action | Description |
|---|---|
| View Profile | See user details, order history, addresses |
| Change Role | Promote to vendor or admin |
| Suspend Account | Temporarily disable login |
| Delete Account | Permanently remove user (use with caution) |
| Reset Password | Send password reset email |
| View Activity Log | See user's activity history |

### Managing Admin Access

- Only grant admin role to trusted personnel.
- Enable 2FA for all admin accounts.
- Use the IP whitelist to restrict access to known locations.
- Regularly audit admin accounts and remove unused ones.

---

## Product Management

### Viewing Products

1. Go to **Admin → Products**.
2. Filter by category, vendor, status, or price range.
3. Search by name or SKU.

### Product Actions

| Action | Description |
|---|---|
| View | See full product details, images, reviews |
| Edit | Modify product information (admin override) |
| Approve | Make a pending product visible to customers |
| Reject | Remove a product from the marketplace |
| Feature | Highlight on the homepage |
| Delete | Permanently remove product |

### Product Moderation

- Review new product submissions from vendors.
- Check for prohibited items, counterfeit goods, or policy violations.
- Verify product images match descriptions.
- Ensure pricing is fair and competitive.

### Category Management

- Add, edit, or remove product categories.
- Set category display order.
- Configure category-specific attributes.

---

## Order Management

### Viewing Orders

1. Go to **Admin → Orders**.
2. Filter by status, date range, payment status, or customer.
3. Search by order ID or customer name.

### Order Statuses

| Status | Description |
|---|---|
| `pending` | Order placed, awaiting payment confirmation |
| `confirmed` | Payment confirmed, ready for processing |
| `processing` | Vendor is preparing the order |
| `shipped` | Order dispatched with tracking number |
| `delivered` | Order received by customer |
| `cancelled` | Order cancelled (by customer or admin) |
| `refunded` | Refund processed |

### Admin Order Actions

| Action | Description |
|---|---|
| View Details | See full order information |
| Update Status | Manually change order status |
| Add Tracking | Add carrier and tracking number |
| Process Refund | Initiate a full or partial refund |
| Cancel Order | Cancel and notify customer |
| Print Invoice | Generate printable invoice |
| Contact Customer | Send a message to the customer |

### Handling Disputes

1. Review the order details and communication history.
2. Check the payment and shipping records.
3. Contact the customer and vendor to mediate.
4. Process refunds if necessary through the payment gateway.
5. Log all actions in the activity log.

---

## Vendor Management

### Vendor Applications

1. Go to **Admin → Vendors**.
2. Review pending applications.
3. Check business name, contact details, and submitted documents.
4. Approve or reject with a reason.

### Vendor Actions

| Action | Description |
|---|---|
| View Profile | See vendor business details |
| Approve | Activate vendor account |
| Reject | Decline with reason (email sent automatically) |
| Suspend | Temporarily disable vendor |
| View Store | Visit the vendor's storefront |
| View Products | See all products from this vendor |
| View Orders | See all orders for this vendor |
| View Earnings | See vendor payout history |

### Store Management

- Monitor store performance and ratings.
- Review store for policy compliance.
- Suspend stores that violate terms of service.
- Feature high-performing stores on the homepage.

---

## Analytics & Reports

### Available Reports

| Report | Description |
|---|---|
| Sales Report | Revenue by day, week, month, or year |
| Product Performance | Best and worst selling products |
| Category Analysis | Revenue and order count by category |
| Vendor Performance | Sales, ratings, and fulfillment metrics |
| Customer Insights | Registration trends, repeat purchase rate |
| Payment Gateway Report | Transaction volume by gateway |
| Refund Report | Refund volume and reasons |
| Inventory Report | Stock levels and low-stock alerts |

### Exporting Reports

1. Go to **Admin → Analytics**.
2. Select the report type and date range.
3. Click **Export** to download as CSV or PDF.

### Custom Dashboards

- Create custom dashboard views with selected metrics.
- Schedule automated email reports.
- Set up alerts for threshold-based triggers (e.g., low stock, high refund rate).

---

## Audit Logs

The `activity_logs` table tracks all significant actions in the system.

### What is Logged

- User authentication events (login, logout, password changes)
- Order status changes
- Payment events (success, failure, refund)
- Product creation, updates, and deletions
- Vendor approvals and rejections
- Admin settings changes
- Maintenance mode toggles

### Viewing Audit Logs

1. Go to **Admin → Audit Logs**.
2. Filter by:
   - Action type (e.g., `payment.success`, `order.cancelled`)
   - Entity type (e.g., `order`, `product`, `payment`)
   - Date range
   - User/admin who performed the action
3. Export logs for compliance and reporting.

### Retention Policy

- Activity logs are retained for 90 days by default.
- Configure retention in **Settings → Security**.
- Archive old logs to cold storage for long-term compliance.

---

## Support Tickets

### Viewing Tickets

1. Go to **Admin → Support Tickets**.
2. Filter by status (open, in-progress, resolved, closed), priority, or category.

### Managing Tickets

| Action | Description |
|---|---|
| View | Read the full ticket conversation |
| Reply | Respond to the customer |
| Assign | Assign to a team member |
| Change Priority | Set as low, medium, high, or urgent |
| Change Status | Update ticket status |
| Close | Mark as resolved and close |
| Escalate | Escalate to senior support or engineering |

### Best Practices

- Respond to tickets within 24 hours.
- Use canned responses for common questions.
- Link related orders or products in the ticket.
- Escalate payment or security issues immediately.
- Close resolved tickets promptly.

---

## Security Best Practices

### Admin Account Security

- **Enable 2FA** for all admin accounts.
- Use **strong, unique passwords** (minimum 12 characters).
- **Limit admin access** to only those who need it.
- **Review admin accounts** monthly and remove inactive ones.
- Use the **IP whitelist** to restrict admin panel access.

### Data Protection

- Never share the Supabase service role key.
- Never expose server-side environment variables to the client.
- Use RLS policies to enforce data access control.
- Regularly backup the database.
- Monitor for suspicious activity in audit logs.

### Payment Security

- Never log full payment card numbers.
- Verify webhook signatures on all payment callbacks.
- Monitor for unusual refund patterns.
- Reconcile payments with gateway reports regularly.

### Incident Response

1. **Identify** the scope and severity of the incident.
2. **Contain** by disabling affected accounts or enabling maintenance mode.
3. **Investigate** using audit logs and payment records.
4. **Remediate** by fixing the root cause.
5. **Communicate** with affected users.
6. **Document** the incident and lessons learned.

---

## Support

If you need assistance with admin operations, please contact our support team:

- **Phone:** +233 55 162 1261
- **Email:** smrtmart304@gmail.com

Our team is available to help with admin access, configuration, and any issues you encounter while managing the platform.
