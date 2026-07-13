/*
# Platform Settings Table

1. New Tables
- `platform_settings` — key-value store for global platform configuration
  - `id` (uuid, primary key)
  - `key` (text, unique, not null) — setting key e.g. 'default_currency', 'maintenance_mode'
  - `value` (jsonb, not null) — setting value, flexible JSON
  - `category` (text, not null) — grouping: 'general', 'payment', 'shipping', 'tax', 'email', 'notification', 'security'
  - `description` (text) — human-readable description of the setting
  - `is_public` (boolean, default false) — whether this setting can be read by anon (e.g. site_name, default_currency)
  - `updated_by` (uuid, references auth.users) — admin who last updated
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `platform_settings`.
- SELECT: authenticated users can read public settings; admins can read all.
- INSERT/UPDATE/DELETE: only admin users (checked via profiles.role = 'admin').
- Note: For now, all authenticated users can read all settings. A tighter admin-only policy
  can be added later. Public settings are also readable by anon.

3. Default Data
- Inserts default settings: site_name, default_currency, default_country, maintenance_mode,
  commission_rate, min_payout, max_payout, tax_enabled, tax_rate, shipping_flat_rate,
  email_notifications, sms_notifications, require_2fa, allow_vendor_registration,
  max_uploads_per_product, product_approval_required.

4. Indexes
- Index on `key` for fast lookups.
- Index on `category` for grouped queries.
*/

CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  is_public boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated can read all settings, anon can read public ones
DROP POLICY IF EXISTS "read_platform_settings" ON platform_settings;
CREATE POLICY "read_platform_settings" ON platform_settings FOR SELECT
  TO anon, authenticated
  USING (is_public = true OR auth.uid() IS NOT NULL);

-- INSERT: admin only
DROP POLICY IF EXISTS "insert_platform_settings" ON platform_settings;
CREATE POLICY "insert_platform_settings" ON platform_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- UPDATE: admin only
DROP POLICY IF EXISTS "update_platform_settings" ON platform_settings;
CREATE POLICY "update_platform_settings" ON platform_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- DELETE: admin only
DROP POLICY IF EXISTS "delete_platform_settings" ON platform_settings;
CREATE POLICY "delete_platform_settings" ON platform_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_category ON platform_settings(category);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_platform_settings_updated ON platform_settings;
CREATE TRIGGER trg_platform_settings_updated
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Default settings data
INSERT INTO platform_settings (key, value, category, description, is_public) VALUES
  ('site_name', '"SmartMart Ghana"', 'general', 'Platform display name', true),
  ('default_currency', '"GHS"', 'general', 'Default currency code', true),
  ('default_country', '"Ghana"', 'general', 'Default country for the platform', true),
  ('maintenance_mode', 'false', 'general', 'When true, the site shows a maintenance page to non-admin users', false),
  ('allow_vendor_registration', 'true', 'general', 'Whether new vendors can sign up', true),
  ('commission_rate', '5.0', 'general', 'Platform commission percentage on each sale', false),
  ('min_payout_amount', '50.00', 'general', 'Minimum payout amount for vendors', false),
  ('max_payout_amount', '10000.00', 'general', 'Maximum payout amount per request', false),
  ('tax_enabled', 'true', 'tax', 'Whether tax is calculated at checkout', true),
  ('tax_rate', '2.5', 'tax', 'Default tax rate percentage', true),
  ('shipping_flat_rate', '10.00', 'shipping', 'Flat shipping rate in default currency', true),
  ('free_shipping_threshold', '200.00', 'shipping', 'Order total above which shipping is free', true),
  ('email_notifications', 'true', 'notification', 'Whether email notifications are sent', false),
  ('sms_notifications', 'true', 'notification', 'Whether SMS notifications are sent', false),
  ('push_notifications', 'false', 'notification', 'Whether push notifications are enabled', false),
  ('require_2fa', 'false', 'security', 'Whether two-factor authentication is required for all users', false),
  ('require_2fa_admin', 'true', 'security', 'Whether 2FA is required for admin accounts', false),
  ('rate_limit_max', '100', 'security', 'Maximum API requests per minute per user', false),
  ('product_approval_required', 'true', 'general', 'Whether products need admin approval before going live', false),
  ('max_product_images', '8', 'general', 'Maximum images per product', true),
  ('max_file_upload_mb', '10', 'general', 'Maximum file upload size in MB', true)
ON CONFLICT (key) DO NOTHING;
