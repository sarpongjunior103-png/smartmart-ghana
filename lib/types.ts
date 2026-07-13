export type UserRole = 'customer' | 'vendor' | 'admin';

export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  country: string | null;
  city: string | null;
  language: string | null;
  referral_code: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon: string | null;
  image_url: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  vendor_id: string | null;
  category_id: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  discount_price: number | null;
  image_url: string | null;
  stock: number;
  brand: string | null;
  sku: string | null;
  barcode: string | null;
  video_url: string | null;
  shipping_weight: number | null;
  warranty: string | null;
  delivery_time: string | null;
  specifications: Record<string, string> | null;
  tags: string[];
  is_featured: boolean;
  rating: number;
  review_count: number;
  status: 'draft' | 'published' | 'archived' | 'pending' | 'rejected' | 'suspended';
  created_at: string;
  updated_at: string | null;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  position: number;
  created_at: string;
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
  order_number: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total: number;
  payment_method: string | null;
  delivery_method: string | null;
  coupon_code: string | null;
  shipping_address: any;
  tracking_number: string | null;
  estimated_delivery_date: string | null;
  delivery_status: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  price: number;
  quantity: number;
  vendor_id: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  order_id: string;
  provider: string | null;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference: string | null;
  phone: string | null;
  gateway: string | null;
  gateway_reference: string | null;
  gateway_response: any;
  currency: string | null;
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
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

export type Vendor = {
  id: string;
  business_name: string;
  owner_name: string | null;
  business_email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  business_address: string | null;
  business_category: string | null;
  tax_number: string | null;
  logo_url: string | null;
  id_url: string | null;
  slug: string | null;
  description: string | null;
  banner_url: string | null;
  rating: number;
  contact_email: string | null;
  contact_phone: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
};

export type StoreFollow = {
  id: string;
  follower_id: string;
  vendor_id: string;
  created_at: string;
};

export type ProductQuestion = {
  id: string;
  product_id: string;
  asker_id: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
};

export type VendorEarning = {
  id: string;
  vendor_id: string;
  order_item_id: string | null;
  amount: number;
  type: 'earning' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};

export type StoreReview = {
  id: string;
  vendor_id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
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
  ticket_number: string;
  user_id: string;
  subject: string;
  description: string | null;
  category: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  order_id: string | null;
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
  vendor_id: string;
  change_type: string;
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  created_at: string;
};

export type ChatConversation = {
  id: string;
  participant1_id: string;
  participant2_id: string;
  type: string;
  product_id: string | null;
  status: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
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
