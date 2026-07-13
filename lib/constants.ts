// @ts-nocheck
export const COUNTRIES = [
  'Ghana',
  'Nigeria',
  'Kenya',
  'South Africa',
  'Egypt',
  'Morocco',
  'Tanzania',
  'Uganda',
  'Rwanda',
  'Senegal',
  'Ivory Coast',
  'Cameroon',
  'Ethiopia',
  'Zambia',
  'Zimbabwe',
];

export const GHANA_CITIES = [
  'Accra',
  'Kumasi',
  'Tamale',
  'Takoradi',
  'Cape Coast',
  'Tema',
  'Sekondi',
  'Sunyani',
  'Ho',
  'Bolgatanga',
  'Wa',
  'Koforidua',
];

export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Central',
  'Eastern',
  'Northern',
  'Upper East',
  'Upper West',
  'Volta',
  'Bono',
  'Bono East',
  'Ahafo',
  'Oti',
  'Western North',
  'Savannah',
  'North East',
];

export const BUSINESS_CATEGORIES = [
  'Electronics',
  'Fashion & Apparel',
  'Phones & Accessories',
  'Computers & IT',
  'Beauty & Cosmetics',
  'Groceries & Food',
  'Home & Kitchen',
  'Books & Stationery',
  'Sports & Fitness',
  'Health & Wellness',
  'Toys & Games',
  'Automotive',
];

export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Phones',
  'Computers',
  'Fashion',
  'Shoes',
  'Beauty',
  'Groceries',
  'Health',
  'Home & Kitchen',
  'Furniture',
  'Books',
  'Sports',
  'Gaming',
  'Agriculture',
  'Automotive',
];

export const ADMIN_EMAIL = 'admin@smartmartghana.com';

export const PAYMENT_METHODS = [
  { id: 'mtn_momo', label: 'MTN Mobile Money', icon: '📱', description: 'Pay with MTN MoMo' },
  { id: 'telecel_cash', label: 'Telecel Cash', icon: '💳', description: 'Pay with Telecel Cash' },
  { id: 'airteltigo_money', label: 'AirtelTigo Money', icon: '💸', description: 'Pay with AirtelTigo Money' },
  { id: 'visa', label: 'Visa Card', icon: '💳', description: 'Credit / Debit Card' },
  { id: 'mastercard', label: 'Mastercard', icon: '💳', description: 'Credit / Debit Card' },
  { id: 'cash_on_delivery', label: 'Cash on Delivery', icon: '🚚', description: 'Pay when you receive' },
] as const;

export const DELIVERY_METHODS = [
  { id: 'standard', label: 'Standard Delivery', description: '3-5 business days', fee: 15 },
  { id: 'express', label: 'Express Delivery', description: '1-2 business days', fee: 35 },
  { id: 'pickup', label: 'Pickup Station', description: 'Pick up at nearest station', fee: 0 },
] as const;

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-800' },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-orange-100 text-orange-800' },
};

export const PAYMENT_GATEWAYS = [
  { id: 'hubtel', label: 'Hubtel', description: 'Mobile Money & Cards', supports: ['mtn_momo', 'telecel_cash', 'airteltigo_money', 'visa', 'mastercard'] },
  { id: 'paystack', label: 'Paystack', description: 'Cards & Bank Transfer', supports: ['visa', 'mastercard'] },
  { id: 'flutterwave', label: 'Flutterwave', description: 'Cards, MoMo & Bank', supports: ['mtn_momo', 'telecel_cash', 'airteltigo_money', 'visa', 'mastercard'] },
  { id: 'stripe', label: 'Stripe', description: 'International Cards', supports: ['visa', 'mastercard'] },
  { id: 'cash_on_delivery', label: 'Cash on Delivery', description: 'Pay when you receive', supports: [] },
] as const;

export const DELIVERY_STATUS_LABELS: Record<string, { label: string; color: string; step: number }> = {
  order_received: { label: 'Order Received', color: 'bg-blue-100 text-blue-800', step: 1 },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-800', step: 2 },
  packed: { label: 'Packed', color: 'bg-cyan-100 text-cyan-800', step: 3 },
  dispatched: { label: 'Dispatched', color: 'bg-amber-100 text-amber-800', step: 4 },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-800', step: 5 },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', step: 6 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', step: 0 },
  returned: { label: 'Returned', color: 'bg-red-100 text-red-800', step: 0 },
};

export const DELIVERY_TIMELINE: { key: string; label: string; description: string }[] = [
  { key: 'order_received', label: 'Order Received', description: 'We have received your order' },
  { key: 'processing', label: 'Processing', description: 'Your order is being prepared' },
  { key: 'packed', label: 'Packed', description: 'Your order has been packed' },
  { key: 'dispatched', label: 'Dispatched', description: 'Your order has been handed to the carrier' },
  { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Your order is on its way to you' },
  { key: 'delivered', label: 'Delivered', description: 'Your order has been delivered' },
];

export const NOTIFICATION_TYPES = [
  { id: 'order_update', label: 'Order Updates', description: 'Updates about your orders' },
  { id: 'payment_confirmation', label: 'Payment Confirmations', description: 'Confirmations for payments made' },
  { id: 'vendor_alerts', label: 'Vendor Alerts', description: 'Alerts for vendors about new orders' },
  { id: 'delivery_update', label: 'Delivery Updates', description: 'Updates about your delivery' },
  { id: 'system', label: 'System', description: 'System notifications' },
  { id: 'promotional', label: 'Promotional', description: 'Promotional offers and deals' },
  { id: 'support', label: 'Support', description: 'Support ticket updates' },
] as const;

export const TICKET_CATEGORIES = [
  { id: 'general', label: 'General Inquiry' },
  { id: 'order', label: 'Order Issue' },
  { id: 'payment', label: 'Payment Issue' },
  { id: 'delivery', label: 'Delivery Issue' },
  { id: 'product', label: 'Product Issue' },
  { id: 'account', label: 'Account Issue' },
  { id: 'refund', label: 'Refund Request' },
] as const;

export const TICKET_PRIORITIES = [
  { id: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { id: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { id: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
] as const;

export const TICKET_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-800' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800' },
};

export const INVENTORY_CHANGE_TYPES: Record<string, { label: string; color: string }> = {
  order: { label: 'Order', color: 'bg-red-100 text-red-800' },
  restock: { label: 'Restock', color: 'bg-green-100 text-green-800' },
  adjustment: { label: 'Adjustment', color: 'bg-amber-100 text-amber-800' },
  return: { label: 'Return', color: 'bg-blue-100 text-blue-800' },
};

export const LOW_STOCK_THRESHOLD = 10;

export const formatPrice = (price: number): string => {
  return `GH₵ ${price.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const calculateDiscountPercent = (price: number, discountPrice: number | null): number => {
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
};

export const getEffectivePrice = (product: { price: number; discount_price: number | null }): number => {
  return product.discount_price && product.discount_price < product.price ? product.discount_price : product.price;
};

// ===== Multi-Country Support =====

export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  flag: string;
  taxRate: number;
  shippingBase: number;
  phoneCode: string;
}

export const AFRICAN_COUNTRIES: CountryConfig[] = [
  { code: 'GH', name: 'Ghana', currency: 'GHS', currencySymbol: 'GH₵', flag: '🇬🇭', taxRate: 0.0, shippingBase: 15, phoneCode: '+233' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', currencySymbol: '₦', flag: '🇳🇬', taxRate: 0.075, shippingBase: 2000, phoneCode: '+234' },
  { code: 'KE', name: 'Kenya', currency: 'KES', currencySymbol: 'KSh', flag: '🇰🇪', taxRate: 0.16, shippingBase: 200, phoneCode: '+254' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', currencySymbol: 'R', flag: '🇿🇦', taxRate: 0.15, shippingBase: 80, phoneCode: '+27' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', currencySymbol: 'USh', flag: '🇺🇬', taxRate: 0.18, shippingBase: 15000, phoneCode: '+256' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', currencySymbol: 'TSh', flag: '🇹🇿', taxRate: 0.18, shippingBase: 5000, phoneCode: '+255' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', currencySymbol: 'FRw', flag: '🇷🇼', taxRate: 0.18, shippingBase: 2000, phoneCode: '+250' },
  { code: 'BW', name: 'Botswana', currency: 'BWP', currencySymbol: 'P', flag: '🇧🇼', taxRate: 0.14, shippingBase: 50, phoneCode: '+267' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', currencySymbol: 'ZK', flag: '🇿🇲', taxRate: 0.16, shippingBase: 30, phoneCode: '+260' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'USD', currencySymbol: 'US$', flag: '🇿🇼', taxRate: 0.15, shippingBase: 5, phoneCode: '+263' },
];

export const COUNTRY_BY_CODE: Record<string, CountryConfig> = AFRICAN_COUNTRIES.reduce(
  (acc, c) => { acc[c.code] = c; return acc; },
  {} as Record<string, CountryConfig>
);

export const COUNTRY_BY_NAME: Record<string, CountryConfig> = AFRICAN_COUNTRIES.reduce(
  (acc, c) => { acc[c.name] = c; return acc; },
  {} as Record<string, CountryConfig>
);

// ===== Multi-Language Support =====

export interface LanguageConfig {
  code: string;
  label: string;
  flag: string;
}

export const LANGUAGES: LanguageConfig[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'nav.home': 'Home', 'nav.categories': 'Categories', 'nav.search': 'Search', 'nav.cart': 'Cart',
    'nav.login': 'Login', 'nav.register': 'Register', 'nav.logout': 'Logout', 'nav.dashboard': 'Dashboard',
    'nav.seller': 'Sell on SmartMart', 'nav.orders': 'My Orders', 'nav.wishlist': 'Wishlist',
    'hero.title': 'Shop Smart, Live Better', 'hero.subtitle': 'Your one-stop marketplace for everything',
    'hero.cta': 'Start Shopping', 'hero.cta2': 'Become a Seller',
    'product.addToCart': 'Add to Cart', 'product.buyNow': 'Buy Now', 'product.outOfStock': 'Out of Stock',
    'product.reviews': 'Reviews', 'product.related': 'Related Products', 'product.specs': 'Specifications',
    'cart.empty': 'Your cart is empty', 'cart.subtotal': 'Subtotal', 'cart.total': 'Total',
    'cart.checkout': 'Proceed to Checkout', 'cart.continue': 'Continue Shopping',
    'checkout.title': 'Checkout', 'checkout.delivery': 'Delivery Information', 'checkout.payment': 'Payment',
    'checkout.placeOrder': 'Place Order', 'checkout.estimatedDelivery': 'Estimated Delivery',
    'order.track': 'Track Order', 'order.cancel': 'Cancel Order', 'order.invoice': 'View Invoice',
    'chat.title': 'Live Chat', 'chat.placeholder': 'Type a message...', 'chat.online': 'Online',
    'chat.offline': 'Offline', 'chat.typing': 'typing...', 'chat.send': 'Send',
    'ai.title': 'AI Shopping Assistant', 'ai.placeholder': 'Ask me anything about products...',
    'referral.title': 'Referral Program', 'referral.code': 'Your Referral Code', 'referral.share': 'Share & Earn',
    'referral.earnings': 'Total Earnings', 'referral.invited': 'People Invited',
    'loyalty.title': 'Loyalty Program', 'loyalty.points': 'Points', 'loyalty.tier': 'Tier',
    'loyalty.redeem': 'Redeem Points', 'loyalty.earned': 'Total Earned',
    'country.select': 'Select Country', 'language.select': 'Select Language',
    'common.loading': 'Loading...', 'common.error': 'Something went wrong', 'common.save': 'Save',
    'common.cancel': 'Cancel', 'common.delete': 'Delete', 'common.edit': 'Edit', 'common.close': 'Close',
  },
  fr: {
    'nav.home': 'Accueil', 'nav.categories': 'Catégories', 'nav.search': 'Rechercher', 'nav.cart': 'Panier',
    'nav.login': 'Connexion', 'nav.register': "S'inscrire", 'nav.logout': 'Déconnexion', 'nav.dashboard': 'Tableau de bord',
    'nav.seller': 'Vendre sur SmartMart', 'nav.orders': 'Mes commandes', 'nav.wishlist': 'Favoris',
    'hero.title': 'Achetez malin, vivez mieux', 'hero.subtitle': 'Votre marketplace pour tout',
    'hero.cta': 'Commencer', 'hero.cta2': 'Devenir vendeur',
    'product.addToCart': 'Ajouter au panier', 'product.buyNow': 'Acheter maintenant', 'product.outOfStock': 'Rupture de stock',
    'product.reviews': 'Avis', 'product.related': 'Produits similaires', 'product.specs': 'Spécifications',
    'cart.empty': 'Votre panier est vide', 'cart.subtotal': 'Sous-total', 'cart.total': 'Total',
    'cart.checkout': 'Passer la commande', 'cart.continue': 'Continuer vos achats',
    'checkout.title': 'Commande', 'checkout.delivery': 'Livraison', 'checkout.payment': 'Paiement',
    'checkout.placeOrder': 'Commander', 'checkout.estimatedDelivery': 'Livraison estimée',
    'order.track': 'Suivre', 'order.cancel': 'Annuler', 'order.invoice': 'Facture',
    'chat.title': 'Chat en direct', 'chat.placeholder': 'Tapez un message...', 'chat.online': 'En ligne',
    'chat.offline': 'Hors ligne', 'chat.typing': 'écrit...', 'chat.send': 'Envoyer',
    'ai.title': 'Assistant IA', 'ai.placeholder': 'Posez vos questions...',
    'referral.title': 'Parrainage', 'referral.code': 'Code de parrainage', 'referral.share': 'Partagez & gagnez',
    'referral.earnings': 'Gains totaux', 'referral.invited': 'Personnes invitées',
    'loyalty.title': 'Fidélité', 'loyalty.points': 'Points', 'loyalty.tier': 'Niveau',
    'loyalty.redeem': 'Échanger', 'loyalty.earned': 'Total gagné',
    'country.select': 'Pays', 'language.select': 'Langue',
    'common.loading': 'Chargement...', 'common.error': 'Une erreur est survenue', 'common.save': 'Enregistrer',
    'common.cancel': 'Annuler', 'common.delete': 'Supprimer', 'common.edit': 'Modifier', 'common.close': 'Fermer',
  },
  sw: {
    'nav.home': 'Nyumbani', 'nav.categories': 'Kategoria', 'nav.search': 'Tafuta', 'nav.cart': 'Kikapu',
    'nav.login': 'Ingia', 'nav.register': 'Jisajili', 'nav.logout': 'Toka', 'nav.dashboard': 'Dashibodi',
    'nav.seller': 'Uza kwenye SmartMart', 'nav.orders': 'Maagizo yangu', 'nav.wishlist': 'Wishlist',
    'hero.title': 'Nunua kwa busara, ishi vizuri', 'hero.subtitle': 'Soko lako la kila kitu',
    'hero.cta': 'Anza Kununua', 'hero.cta2': 'Kuwa Muuzaji',
    'product.addToCart': 'Ongeza kwenye kikapu', 'product.buyNow': 'Nunua sasa', 'product.outOfStock': 'Hakuna hisa',
    'product.reviews': 'Maoni', 'product.related': 'Bidhaa zinazofanana', 'product.specs': 'Maelezo',
    'cart.empty': 'Kikapu chako ni tupu', 'cart.subtotal': 'Jumla ndogo', 'cart.total': 'Jumla',
    'cart.checkout': 'Endelea kwa malipo', 'cart.continue': 'Endelea kununua',
    'checkout.title': 'Malipo', 'checkout.delivery': 'Uwasilishaji', 'checkout.payment': 'Lipa',
    'checkout.placeOrder': 'Agiza', 'checkout.estimatedDelivery': 'Uwasilishaji unatarajiwa',
    'order.track': 'Fuata agizo', 'order.cancel': 'Futa', 'order.invoice': 'Ankara',
    'chat.title': 'Mazungumzo', 'chat.placeholder': 'Andika ujumbe...', 'chat.online': 'Mtandaoni',
    'chat.offline': 'Nje ya mtandao', 'chat.typing': 'anaandika...', 'chat.send': 'Tuma',
    'ai.title': 'Msaidizi wa AI', 'ai.placeholder': 'Uliza chochote...',
    'referral.title': 'Programu ya rufaa', 'referral.code': 'Msimbo wako', 'referral.share': 'Shiriki & Pata',
    'referral.earnings': 'Mapato yote', 'referral.invited': 'Watu walioalikwa',
    'loyalty.title': 'Uaminifu', 'loyalty.points': 'Pointi', 'loyalty.tier': 'Kiwango',
    'loyalty.redeem': 'Badilisha pointi', 'loyalty.earned': 'Jumla',
    'country.select': 'Nchi', 'language.select': 'Lugha',
    'common.loading': 'Inapakia...', 'common.error': 'Kuna hitilafu', 'common.save': 'Hifadhi',
    'common.cancel': 'Futa', 'common.delete': 'Futa', 'common.edit': 'Hariri', 'common.close': 'Funga',
  },
  ar: {
    'nav.home': 'الرئيسية', 'nav.categories': 'الفئات', 'nav.search': 'بحث', 'nav.cart': 'السلة',
    'nav.login': 'تسجيل الدخول', 'nav.register': 'تسجيل', 'nav.logout': 'خروج', 'nav.dashboard': 'لوحة التحكم',
    'nav.seller': 'بيع على SmartMart', 'nav.orders': 'طلباتي', 'nav.wishlist': 'المفضلة',
    'hero.title': 'تسوق بذكاء، عيش بشكل أفضل', 'hero.subtitle': 'سوقك لكل شيء',
    'hero.cta': 'ابدأ التسوق', 'hero.cta2': 'كن بائعا',
    'product.addToCart': 'أضف للسلة', 'product.buyNow': 'اشتر الآن', 'product.outOfStock': 'نفد المخزون',
    'product.reviews': 'التقييمات', 'product.related': 'منتجات ذات صلة', 'product.specs': 'المواصفات',
    'cart.empty': 'سلتك فارغة', 'cart.subtotal': 'المجموع الفرعي', 'cart.total': 'المجموع',
    'cart.checkout': 'إتمام الشراء', 'cart.continue': 'متابعة التسوق',
    'checkout.title': 'الدفع', 'checkout.delivery': 'التوصيل', 'checkout.payment': 'الدفع',
    'checkout.placeOrder': 'تأكيد الطلب', 'checkout.estimatedDelivery': 'التوصيل المتوقع',
    'order.track': 'تتبع الطلب', 'order.cancel': 'إلغاء', 'order.invoice': 'فاتورة',
    'chat.title': 'دردشة مباشرة', 'chat.placeholder': 'اكتب رسالة...', 'chat.online': 'متصل',
    'chat.offline': 'غير متصل', 'chat.typing': 'يكتب...', 'chat.send': 'إرسال',
    'ai.title': 'مساعد التسوق الذكي', 'ai.placeholder': 'اسألني أي شيء...',
    'referral.title': 'برنامج الإحالة', 'referral.code': 'رمز الإحالة', 'referral.share': 'شارك واربح',
    'referral.earnings': 'إجمالي الأرباح', 'referral.invited': 'الأشخاص المدعوون',
    'loyalty.title': 'برنامج الولاء', 'loyalty.points': 'نقاط', 'loyalty.tier': 'المستوى',
    'loyalty.redeem': 'استبدل النقاط', 'loyalty.earned': 'إجمالي المكتسب',
    'country.select': 'اختر الدولة', 'language.select': 'اختر اللغة',
    'common.loading': 'جار التحميل...', 'common.error': 'حدث خطأ', 'common.save': 'حفظ',
    'common.cancel': 'إلغاء', 'common.delete': 'حذف', 'common.edit': 'تعديل', 'common.close': 'إغلاق',
  },
  pt: {
    'nav.home': 'Início', 'nav.categories': 'Categorias', 'nav.search': 'Pesquisar', 'nav.cart': 'Carrinho',
    'nav.login': 'Entrar', 'nav.register': 'Registrar', 'nav.logout': 'Sair', 'nav.dashboard': 'Painel',
    'nav.seller': 'Vender no SmartMart', 'nav.orders': 'Meus pedidos', 'nav.wishlist': 'Favoritos',
    'hero.title': 'Compre inteligente, viva melhor', 'hero.subtitle': 'Seu marketplace para tudo',
    'hero.cta': 'Começar a comprar', 'hero.cta2': 'Tornar-se vendedor',
    'product.addToCart': 'Adicionar ao carrinho', 'product.buyNow': 'Comprar agora', 'product.outOfStock': 'Esgotado',
    'product.reviews': 'Avaliações', 'product.related': 'Produtos relacionados', 'product.specs': 'Especificações',
    'cart.empty': 'Seu carrinho está vazio', 'cart.subtotal': 'Subtotal', 'cart.total': 'Total',
    'cart.checkout': 'Finalizar compra', 'cart.continue': 'Continuar comprando',
    'checkout.title': 'Checkout', 'checkout.delivery': 'Entrega', 'checkout.payment': 'Pagamento',
    'checkout.placeOrder': 'Fazer pedido', 'checkout.estimatedDelivery': 'Entrega estimada',
    'order.track': 'Rastrear pedido', 'order.cancel': 'Cancelar', 'order.invoice': 'Fatura',
    'chat.title': 'Chat ao vivo', 'chat.placeholder': 'Digite uma mensagem...', 'chat.online': 'Online',
    'chat.offline': 'Offline', 'chat.typing': 'digitando...', 'chat.send': 'Enviar',
    'ai.title': 'Assistente de compras IA', 'ai.placeholder': 'Pergunte-me qualquer coisa...',
    'referral.title': 'Programa de referência', 'referral.code': 'Seu código', 'referral.share': 'Compartilhe e ganhe',
    'referral.earnings': 'Ganhos totais', 'referral.invited': 'Pessoas convidadas',
    'loyalty.title': 'Programa de fidelidade', 'loyalty.points': 'Pontos', 'loyalty.tier': 'Nível',
    'loyalty.redeem': 'Resgatar pontos', 'loyalty.earned': 'Total ganho',
    'country.select': 'Selecionar país', 'language.select': 'Selecionar idioma',
    'common.loading': 'Carregando...', 'common.error': 'Algo deu errado', 'common.save': 'Salvar',
    'common.cancel': 'Cancelar', 'common.delete': 'Excluir', 'common.edit': 'Editar', 'common.close': 'Fechar',
  },
};

export function translate(key: string, lang: string = 'en'): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

// ===== Currency Formatting =====

export function formatPriceForCountry(price: number, countryCode: string = 'GH'): string {
  const country = COUNTRY_BY_CODE[countryCode] ?? COUNTRY_BY_CODE['GH'];
  const converted = convertFromGHS(price, country.currency);
  return `${country.currencySymbol} ${converted.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Approximate static exchange rates relative to GHS
export const EXCHANGE_RATES: Record<string, number> = {
  GHS: 1,
  NGN: 120,
  KES: 16,
  ZAR: 2.4,
  UGX: 350,
  TZS: 16.5,
  RWF: 130,
  BWP: 1.6,
  ZMW: 3.2,
  USD: 0.08,
};

export function convertFromGHS(amountGHS: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES[targetCurrency] ?? 1;
  return amountGHS * rate;
}

export function convertToGHS(amount: number, fromCurrency: string): number {
  const rate = EXCHANGE_RATES[fromCurrency] ?? 1;
  return amount / rate;
}

export function calculateTax(amount: number, countryCode: string): number {
  const country = COUNTRY_BY_CODE[countryCode];
  if (!country) return 0;
  return amount * country.taxRate;
}

export function calculateShipping(countryCode: string, method: string = 'standard'): number {
  const country = COUNTRY_BY_CODE[countryCode];
  if (!country) return 15;
  if (method === 'express') return country.shippingBase * 2.5;
  if (method === 'pickup') return 0;
  return country.shippingBase;
}

// ===== Loyalty Program =====

export const LOYALTY_TIERS = [
  { id: 'bronze', label: 'Bronze', minPoints: 0, color: 'bg-amber-100 text-amber-800', perk: '1 point per GHS 10' },
  { id: 'silver', label: 'Silver', minPoints: 1000, color: 'bg-gray-200 text-gray-800', perk: '1.2x points multiplier' },
  { id: 'gold', label: 'Gold', minPoints: 5000, color: 'bg-yellow-100 text-yellow-800', perk: '1.5x points + free shipping' },
  { id: 'platinum', label: 'Platinum', minPoints: 10000, color: 'bg-purple-100 text-purple-800', perk: '2x points + priority support' },
] as const;

export const LOYALTY_REWARDS = [
  { points: 500, label: 'GHS 25 Discount', value: 25, type: 'discount' },
  { points: 1000, label: 'GHS 60 Discount', value: 60, type: 'discount' },
  { points: 2000, label: 'Free Express Delivery', value: 35, type: 'shipping' },
  { points: 5000, label: 'GHS 350 Discount', value: 350, type: 'discount' },
  { points: 10000, label: 'GHS 800 Discount', value: 800, type: 'discount' },
] as const;

export const REFERRAL_REWARD_REFERRER = 10;
export const REFERRAL_REWARD_REFERRED = 5;
