export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: 'customer' | 'vendor' | 'admin';
  avatar_url: string | null;
  country: string | null;
  language: string | null;
  referral_code: string | null;
  vendor_status: 'pending' | 'approved' | 'rejected' | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  vendor_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_price: number | null;
  stock: number;
  brand: string | null;
  sku: string | null;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  rating: number;
  review_count: number;
  tags: string[];
  images: ProductImage[];
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  position: number;
};

export type Cart = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  delivery_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned' | null;
  tracking_number: string | null;
  estimated_delivery_date: string | null;
  shipping_address: any;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
  product_image: string | null;
};

export type Payment = {
  id: string;
  order_id: string;
  user_id: string | null;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: string;
  gateway: string | null;
  gateway_reference: string | null;
  gateway_response: any;
  currency: string;
  fees: number | null;
  created_at: string;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type Coupon = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order: number | null;
  max_uses: number | null;
  uses: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

export type Vendor = {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  status: 'pending' | 'approved' | 'suspended';
  rating: number;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  order_id: string;
  payment_id: string | null;
  amount: number;
  status: string;
  gateway: string;
  reference: string;
  created_at: string;
};

export type Shipping = {
  id: string;
  order_id: string;
  carrier: string | null;
  tracking_number: string | null;
  status: string;
  estimated_delivery: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

export type TrackingEvent = {
  id: string;
  shipping_id: string;
  status: string;
  location: string | null;
  description: string | null;
  event_time: string;
};

export type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
};

export type SupportMessage = {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
};

export type NotificationSetting = {
  id: string;
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  order_updates: boolean;
  promotions: boolean;
  newsletter: boolean;
};

export type ActivityLog = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: any;
  created_at: string;
};

export type InventoryLog = {
  id: string;
  product_id: string;
  change_type: 'increase' | 'decrease' | 'set';
  quantity: number;
  reason: string | null;
  created_at: string;
};

export type ChatConversation = {
  id: string;
  customer_id: string;
  vendor_id: string | null;
  support_agent_id: string | null;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  attachments: any;
  read: boolean;
  created_at: string;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward_amount: number | null;
  created_at: string;
};

export type LoyaltyPoints = {
  id: string;
  user_id: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  created_at: string;
  updated_at: string;
};

export type LoyaltyTransaction = {
  id: string;
  user_id: string;
  points: number;
  type: 'earn' | 'redeem';
  source: string;
  reference_id: string | null;
  created_at: string;
};

export type UserPreference = {
  id: string;
  user_id: string;
  language: string;
  currency: string;
  country: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  created_at: string;
};

export type PlatformSetting = {
  id: string;
  key: string;
  value: any;
  category: string;
  description: string | null;
  is_public: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentGateway = {
  id: string;
  name: string;
  provider: string;
  is_active: boolean;
  config: Record<string, string>;
  created_at: string;
  updated_at: string;
};
