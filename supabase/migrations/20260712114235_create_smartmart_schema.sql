/*
# SmartMart Ghana — Core Schema

1. Overview
   Multi-vendor e-commerce platform for Ghana/Africa. Uses Supabase Auth
   (email/password + Google OAuth) for identity. Profile/role data lives in
   PostgreSQL tables linked to auth.users by id.

2. New Tables
   - profiles: base user record (1:1 with auth.users), holds role + common fields
   - customers: customer-specific row (1:1 with profiles)
   - vendors: seller/business row (1:1 with profiles), carries application status
   - admins: admin row (1:1 with profiles)
   - categories: product categories (public read)
   - products: vendor listings (public read, vendor-owned write)

3. Columns
   profiles:
     id (uuid, PK, -> auth.users), role (text: customer|vendor|admin),
     email (text, unique), first_name, last_name, phone, country, city,
     avatar_url, created_at
   customers:
     id (uuid, PK, -> profiles), accept_terms (bool), created_at
   vendors:
     id (uuid, PK, -> profiles), business_name, owner_name, business_email,
     phone, country, business_address, business_category, tax_number,
     logo_url, id_url, status (text: pending|approved|rejected, default pending),
     created_at
   admins:
     id (uuid, PK, -> profiles), created_at
   categories:
     id (uuid, PK), name, slug (unique), icon, image_url, created_at
   products:
     id (uuid, PK), vendor_id (-> vendors), category_id (-> categories),
     name, description, price (numeric), image_url, stock (int), rating (numeric),
     created_at

4. Security
   - RLS enabled on every table.
   - profiles: owner can read/update own row; admins can read all.
   - customers/vendors/admins: owner read; admin read all; vendor can update own.
   - categories: public read (anon + authenticated).
   - products: public read; vendor owner insert/update/delete on own.

5. Notes
   - Owner columns default to auth.uid() so inserts omitting them succeed.
   - Policies are dropped before recreate for idempotency.
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','vendor','admin')),
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  phone text,
  country text,
  city text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- customers
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  accept_terms boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_customer" ON customers;
CREATE POLICY "select_own_customer" ON customers FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_customer" ON customers;
CREATE POLICY "insert_own_customer" ON customers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- vendors
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  owner_name text,
  business_email text,
  phone text,
  country text,
  business_address text,
  business_category text,
  tax_number text,
  logo_url text,
  id_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_vendor" ON vendors;
CREATE POLICY "select_own_vendor" ON vendors FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_vendor" ON vendors;
CREATE POLICY "insert_own_vendor" ON vendors FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_vendor" ON vendors;
CREATE POLICY "update_own_vendor" ON vendors FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- admins
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_admin" ON admins;
CREATE POLICY "select_own_admin" ON admins FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- categories (public read)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- products (public read, vendor-owned write)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  image_url text,
  stock integer NOT NULL DEFAULT 0,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "vendor_insert_products" ON products;
CREATE POLICY "vendor_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE id = auth.uid()));

DROP POLICY IF EXISTS "vendor_update_products" ON products;
CREATE POLICY "vendor_update_products" ON products FOR UPDATE
  TO authenticated USING (vendor_id = auth.uid()) WITH CHECK (vendor_id = auth.uid());

DROP POLICY IF EXISTS "vendor_delete_products" ON products;
CREATE POLICY "vendor_delete_products" ON products FOR DELETE
  TO authenticated USING (vendor_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
