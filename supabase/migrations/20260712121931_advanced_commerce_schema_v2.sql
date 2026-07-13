/*
# SmartMart Ghana — Advanced Commerce Schema

1. Overview
   Adds production payment, delivery, support, notification, audit, and
   inventory tables. Extends orders with delivery tracking fields and
   estimated delivery date. Extends payments with gateway-specific fields.

2. Modified Tables
   - orders: added estimated_delivery_date, tracking_number, delivery_status
   - payments: added gateway, gateway_reference, gateway_response, currency, fees

3. New Tables
   - transactions, invoices, shipping, tracking_events
   - support_tickets, support_messages
   - notification_settings, notifications
   - activity_logs, inventory_logs

4. Security
   - RLS on every table. Owner-scoped + admin override.

5. Notes
   - Triggers auto-create shipping + invoice on order insert, reduce stock on order item insert.
*/

-- ===== Extend orders table =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='estimated_delivery_date') THEN
    ALTER TABLE orders ADD COLUMN estimated_delivery_date date;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking_number') THEN
    ALTER TABLE orders ADD COLUMN tracking_number text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_status') THEN
    ALTER TABLE orders ADD COLUMN delivery_status text NOT NULL DEFAULT 'order_received' CHECK (delivery_status IN ('order_received','processing','packed','dispatched','out_for_delivery','delivered','cancelled','returned'));
  END IF;
END $$;

-- ===== Extend payments table =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='gateway') THEN
    ALTER TABLE payments ADD COLUMN gateway text CHECK (gateway IN ('hubtel','paystack','flutterwave','stripe','cash_on_delivery'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='gateway_reference') THEN
    ALTER TABLE payments ADD COLUMN gateway_reference text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='gateway_response') THEN
    ALTER TABLE payments ADD COLUMN gateway_response jsonb;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='currency') THEN
    ALTER TABLE payments ADD COLUMN currency text NOT NULL DEFAULT 'GHS';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='fees') THEN
    ALTER TABLE payments ADD COLUMN fees numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ===== transactions =====
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference text UNIQUE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('payment','refund','payout','adjustment')),
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'GHS',
  gateway text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','refunded','cancelled')),
  description text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);

-- ===== invoices =====
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'GHS',
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','pending','cancelled','refunded')),
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_invoices" ON invoices;
CREATE POLICY "select_own_invoices" ON invoices FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "insert_own_invoices" ON invoices;
CREATE POLICY "insert_own_invoices" ON invoices
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);

-- ===== shipping =====
CREATE TABLE IF NOT EXISTS shipping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier text,
  tracking_number text,
  status text NOT NULL DEFAULT 'order_received' CHECK (status IN ('order_received','processing','packed','dispatched','out_for_delivery','delivered','cancelled','returned')),
  estimated_delivery_date date,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE shipping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_shipping" ON shipping;
CREATE POLICY "select_own_shipping" ON shipping FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
DROP POLICY IF EXISTS "admin_update_shipping" ON shipping;
CREATE POLICY "admin_update_shipping" ON shipping
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
DROP POLICY IF EXISTS "admin_insert_shipping" ON shipping;
CREATE POLICY "admin_insert_shipping" ON shipping
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
CREATE INDEX IF NOT EXISTS idx_shipping_order ON shipping(order_id);

-- ===== tracking_events =====
CREATE TABLE IF NOT EXISTS tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_id uuid NOT NULL REFERENCES shipping(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('order_received','processing','packed','dispatched','out_for_delivery','delivered','cancelled','returned')),
  description text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tracking_events" ON tracking_events;
CREATE POLICY "select_own_tracking_events" ON tracking_events FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM shipping s
      JOIN orders o ON o.id = s.order_id
      WHERE s.id = shipping_id AND o.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
DROP POLICY IF EXISTS "admin_insert_tracking_events" ON tracking_events;
CREATE POLICY "admin_insert_tracking_events" ON tracking_events
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipping ON tracking_events(shipping_id);

-- ===== support_tickets =====
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general','order','payment','delivery','product','account','refund')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tickets" ON support_tickets;
CREATE POLICY "select_own_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "insert_own_tickets" ON support_tickets;
CREATE POLICY "insert_own_tickets" ON support_tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_tickets" ON support_tickets;
CREATE POLICY "update_own_tickets" ON support_tickets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

-- ===== support_messages =====
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON support_messages;
CREATE POLICY "select_own_messages" ON support_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = ticket_id AND support_tickets.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
DROP POLICY IF EXISTS "insert_own_messages" ON support_messages;
CREATE POLICY "insert_own_messages" ON support_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON support_messages(ticket_id);

-- ===== notification_settings =====
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,
  push_enabled boolean NOT NULL DEFAULT true,
  order_updates boolean NOT NULL DEFAULT true,
  payment_confirmations boolean NOT NULL DEFAULT true,
  vendor_alerts boolean NOT NULL DEFAULT true,
  promotional boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notif_settings" ON notification_settings;
CREATE POLICY "select_own_notif_settings" ON notification_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notif_settings" ON notification_settings;
CREATE POLICY "insert_own_notif_settings" ON notification_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notif_settings" ON notification_settings;
CREATE POLICY "update_own_notif_settings" ON notification_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notif_settings_user ON notification_settings(user_id);

-- ===== notifications =====
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('order_update','payment_confirmation','vendor_alert','delivery_update','system','promotional','support')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- ===== activity_logs =====
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_activity_logs" ON activity_logs;
CREATE POLICY "select_own_activity_logs" ON activity_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "insert_activity_logs" ON activity_logs;
CREATE POLICY "insert_activity_logs" ON activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- ===== inventory_logs =====
CREATE TABLE IF NOT EXISTS inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  change_type text NOT NULL CHECK (change_type IN ('order','restock','adjustment','return')),
  quantity_change integer NOT NULL,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_inventory_logs" ON inventory_logs;
CREATE POLICY "select_inventory_logs" ON inventory_logs FOR SELECT
  TO authenticated USING (
    vendor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
DROP POLICY IF EXISTS "insert_inventory_logs" ON inventory_logs;
CREATE POLICY "insert_inventory_logs" ON inventory_logs
  FOR INSERT TO authenticated WITH CHECK (
    vendor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_vendor ON inventory_logs(vendor_id);

-- ===== Triggers =====
CREATE OR REPLACE FUNCTION create_shipping_on_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO shipping (order_id, status, estimated_delivery_date)
  VALUES (NEW.id, 'order_received', CURRENT_DATE + CASE WHEN NEW.delivery_method = 'express' THEN 2 WHEN NEW.delivery_method = 'pickup' THEN 1 ELSE 5 END);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_created ON orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION create_shipping_on_order();

CREATE OR REPLACE FUNCTION create_invoice_on_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO invoices (invoice_number, order_id, user_id, amount, status)
  VALUES ('INV-' || UPPER(SUBSTRING(NEW.order_number FROM 5)), NEW.id, NEW.user_id, NEW.total, 'pending');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_created_invoice ON orders;
CREATE TRIGGER on_order_created_invoice
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION create_invoice_on_order();

CREATE OR REPLACE FUNCTION reduce_stock_on_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_stock integer;
BEGIN
  SELECT stock INTO current_stock FROM products WHERE id = NEW.product_id;
  IF current_stock IS NOT NULL THEN
    UPDATE products SET stock = GREATEST(0, stock - NEW.quantity) WHERE id = NEW.product_id;
    INSERT INTO inventory_logs (product_id, vendor_id, change_type, quantity_change, previous_stock, new_stock, reason)
    SELECT NEW.product_id, p.vendor_id, 'order', -NEW.quantity, current_stock, GREATEST(0, current_stock - NEW.quantity), 'Order ' || NEW.order_id
    FROM products p WHERE p.id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_item_created ON order_items;
CREATE TRIGGER on_order_item_created
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION reduce_stock_on_order();
