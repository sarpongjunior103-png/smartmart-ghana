/*
# SmartMart Ghana — Chat, Referral & Loyalty Schema

1. Overview
   Adds real-time chat (customer↔vendor, customer↔support), referral program,
   and loyalty program tables. Extends profiles with country/language preferences.

2. Modified Tables
   - profiles: added country, language, referral_code columns

3. New Tables
   - chat_conversations: conversation metadata (participant1, participant2, type, product_id)
   - chat_messages: individual messages with text/image/file support
   - referrals: tracks referral inviter, invitee, status, reward
   - loyalty_points: user loyalty point balance
   - loyalty_transactions: ledger of point earning/redemption
   - user_preferences: country, currency, language, notification prefs

4. Security
   - RLS on every table. Owner-scoped + admin override.
   - Chat: both participants can read/insert messages in their conversation.

5. Notes
   - Trigger auto-creates loyalty_points row on new user signup.
   - Trigger awards loyalty points on order completion.
*/

-- ===== Extend profiles table =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='country') THEN
    ALTER TABLE profiles ADD COLUMN country text DEFAULT 'Ghana';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='language') THEN
    ALTER TABLE profiles ADD COLUMN language text DEFAULT 'en';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='referral_code') THEN
    ALTER TABLE profiles ADD COLUMN referral_code text UNIQUE;
  END IF;
END $$;

-- Auto-generate referral code for new users
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'SM' || UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_referral_code ON profiles;
CREATE TRIGGER on_profile_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- Backfill referral codes for existing profiles
UPDATE profiles SET referral_code = 'SM' || UPPER(SUBSTRING(id::text FROM 1 FOR 8)) WHERE referral_code IS NULL;

-- ===== chat_conversations =====
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'customer_support' CHECK (type IN ('customer_vendor','customer_support','vendor_support')),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed','archived')),
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_conversations" ON chat_conversations;
CREATE POLICY "select_own_conversations" ON chat_conversations FOR SELECT
  TO authenticated USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
DROP POLICY IF EXISTS "insert_own_conversations" ON chat_conversations;
CREATE POLICY "insert_own_conversations" ON chat_conversations
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );
DROP POLICY IF EXISTS "update_own_conversations" ON chat_conversations;
CREATE POLICY "update_own_conversations" ON chat_conversations
  FOR UPDATE TO authenticated USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
CREATE INDEX IF NOT EXISTS idx_chat_conv_p1 ON chat_conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_p2 ON chat_conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_last_msg ON chat_conversations(last_message_at);

-- ===== chat_messages =====
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image','file','system')),
  content text NOT NULL,
  file_url text,
  file_name text,
  file_size integer,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_conversation_messages" ON chat_messages;
CREATE POLICY "select_conversation_messages" ON chat_messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
DROP POLICY IF EXISTS "insert_conversation_messages" ON chat_messages;
CREATE POLICY "insert_conversation_messages" ON chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    ) AND auth.uid() = sender_id
  );
DROP POLICY IF EXISTS "update_message_read" ON chat_messages;
CREATE POLICY "update_message_read" ON chat_messages
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_msg_unread ON chat_messages(conversation_id, is_read);

-- ===== referrals =====
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','rewarded','expired')),
  reward_amount numeric(12,2) NOT NULL DEFAULT 10.00,
  referrer_reward numeric(12,2) NOT NULL DEFAULT 10.00,
  referred_reward numeric(12,2) NOT NULL DEFAULT 5.00,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_referrals" ON referrals;
CREATE POLICY "select_own_referrals" ON referrals FOR SELECT
  TO authenticated USING (
    auth.uid() = referrer_id OR auth.uid() = referred_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
DROP POLICY IF EXISTS "insert_own_referrals" ON referrals;
CREATE POLICY "insert_own_referrals" ON referrals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- ===== loyalty_points =====
CREATE TABLE IF NOT EXISTS loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  total_redeemed integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_loyalty" ON loyalty_points;
CREATE POLICY "select_own_loyalty" ON loyalty_points FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_loyalty" ON loyalty_points;
CREATE POLICY "insert_own_loyalty" ON loyalty_points
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_loyalty" ON loyalty_points;
CREATE POLICY "update_own_loyalty" ON loyalty_points
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_user_unique ON loyalty_points(user_id);

-- ===== loyalty_transactions =====
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('earn','redeem','bonus','adjustment')),
  points integer NOT NULL,
  description text,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_loyalty_txns" ON loyalty_transactions;
CREATE POLICY "select_own_loyalty_txns" ON loyalty_transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_loyalty_txns" ON loyalty_transactions;
CREATE POLICY "insert_own_loyalty_txns" ON loyalty_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_txns_user ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_txns_created ON loyalty_transactions(created_at);

-- ===== user_preferences =====
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  country text NOT NULL DEFAULT 'Ghana',
  currency text NOT NULL DEFAULT 'GHS',
  language text NOT NULL DEFAULT 'en',
  email_notifications boolean NOT NULL DEFAULT true,
  sms_notifications boolean NOT NULL DEFAULT false,
  push_notifications boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_prefs" ON user_preferences;
CREATE POLICY "select_own_prefs" ON user_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_prefs" ON user_preferences;
CREATE POLICY "insert_own_prefs" ON user_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_prefs" ON user_preferences;
CREATE POLICY "update_own_prefs" ON user_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_prefs_user_unique ON user_preferences(user_id);

-- ===== Triggers =====
-- Auto-create loyalty_points on new user signup
CREATE OR REPLACE FUNCTION create_loyalty_on_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO loyalty_points (user_id, points, total_earned, tier)
  VALUES (NEW.id, 0, 0, 'bronze')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_signup_loyalty ON profiles;
CREATE TRIGGER on_user_signup_loyalty
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_loyalty_on_signup();

-- Award loyalty points on order completion (1 point per GHS 10 spent)
CREATE OR REPLACE FUNCTION award_loyalty_on_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  points_to_award integer;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered') THEN
    points_to_award := FLOOR(NEW.total / 10);
    IF points_to_award > 0 THEN
      UPDATE loyalty_points
      SET points = points + points_to_award,
          total_earned = total_earned + points_to_award,
          tier = CASE
            WHEN total_earned + points_to_award >= 10000 THEN 'platinum'
            WHEN total_earned + points_to_award >= 5000 THEN 'gold'
            WHEN total_earned + points_to_award >= 1000 THEN 'silver'
            ELSE 'bronze'
          END,
          updated_at = now()
      WHERE user_id = NEW.user_id;

      INSERT INTO loyalty_transactions (user_id, type, points, description, order_id)
      VALUES (NEW.user_id, 'earn', points_to_award, 'Points earned for order ' || NEW.order_number, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_delivered_loyalty ON orders;
CREATE TRIGGER on_order_delivered_loyalty
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION award_loyalty_on_order();

-- Update conversation last_message_at when a message is inserted
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE chat_conversations
  SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_insert_conv_update ON chat_messages;
CREATE TRIGGER on_message_insert_conv_update
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();
