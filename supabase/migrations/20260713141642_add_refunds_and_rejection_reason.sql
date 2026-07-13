/*
# Add refunds table and rejection_reason column to vendors

1. New Tables
- `refunds` — stores customer refund/cancellation requests
  - id (uuid PK)
  - order_id (FK to orders)
  - user_id (uuid, defaults to auth.uid())
  - type (text: 'refund' or 'cancellation')
  - reason (text, customer-provided reason)
  - status (text: 'pending' | 'approved' | 'rejected' | 'completed')
  - admin_notes (text, notes from admin/seller when approving/rejecting)
  - rejection_reason (text, reason for rejecting the refund request)
  - amount (numeric, refund amount)
  - processed_by (uuid, admin/seller who processed the request)
  - created_at, updated_at (timestamps)

2. Modified Tables
- `vendors` — add `rejection_reason` column (text, nullable) to store the reason when a seller application is rejected

3. Security
- Enable RLS on `refunds`
- Customers can CRUD their own refund requests
- Admins and vendors can read and update refund requests (via service role in API routes)
*/

-- Add rejection_reason to vendors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE vendors ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Create refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'refund' CHECK (type IN ('refund', 'cancellation')),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes text,
  rejection_reason text,
  amount numeric NOT NULL DEFAULT 0,
  processed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Policies: customers can manage their own refund requests
DROP POLICY IF EXISTS "select_own_refunds" ON refunds;
CREATE POLICY "select_own_refunds" ON refunds FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_refunds" ON refunds;
CREATE POLICY "insert_own_refunds" ON refunds FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_refunds" ON refunds;
CREATE POLICY "update_own_refunds" ON refunds FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_refunds" ON refunds;
CREATE POLICY "delete_own_refunds" ON refunds FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
