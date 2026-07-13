'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CONTACT } from '@/lib/contact';

// ============================================================================
// Constants
// ============================================================================

const CATEGORIES = [
  { id: 'electronics', label: 'Electronics' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'home', label: 'Home & Garden' },
  { id: 'beauty', label: 'Beauty & Health' },
  { id: 'sports', label: 'Sports & Outdoors' },
  { id: 'toys', label: 'Toys & Games' },
  { id: 'automotive', label: 'Automotive' },
  { id: 'books', label: 'Books & Media' },
  { id: 'grocery', label: 'Grocery & Gourmet' },
  { id: 'industrial', label: 'Industrial & Scientific' },
];

const COUNTRIES = [
  { code: 'GH', name: 'Ghana', currency: 'GHS', dialCode: '+233' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', dialCode: '+234' },
  { code: 'KE', name: 'Kenya', currency: 'KES', dialCode: '+254' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', dialCode: '+27' },
  { code: 'US', name: 'United States', currency: 'USD', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', dialCode: '+44' },
  { code: 'CA', name: 'Canada', currency: 'CAD', dialCode: '+1' },
  { code: 'AU', name: 'Australia', currency: 'AUD', dialCode: '+61' },
  { code: 'DE', name: 'Germany', currency: 'EUR', dialCode: '+49' },
  { code: 'FR', name: 'France', currency: 'EUR', dialCode: '+33' },
];

// ============================================================================
// Types
// ============================================================================

type TabId = 'general' | 'payment' | 'shipping' | 'tax' | 'notification' | 'security';

interface Settings {
  // General
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  storeCountry: string;
  storeCurrency: string;
  storeTimezone: string;
  storeLogo: string;
  storeDescription: string;
  // Payment
  enablePaystack: boolean;
  enableStripe: boolean;
  enableFlutterwave: boolean;
  enableHubtel: boolean;
  enableCashOnDelivery: boolean;
  paystackPublicKey: string;
  paystackSecretKey: string;
  stripePublicKey: string;
  stripeSecretKey: string;
  flutterwavePublicKey: string;
  flutterwaveSecretKey: string;
  hubtelClientId: string;
  hubtelClientSecret: string;
  // Shipping
  enableFreeShipping: boolean;
  freeShippingThreshold: string;
  flatRateShipping: string;
  enableLocalPickup: boolean;
  localPickupFee: string;
  enableInternationalShipping: boolean;
  internationalShippingRate: string;
  shippingOriginAddress: string;
  // Tax
  enableTaxCollection: boolean;
  taxRate: string;
  taxInclusive: boolean;
  enableTaxByState: boolean;
  defaultTaxClass: string;
  // Notification
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;
  orderConfirmationEmail: boolean;
  orderShippedEmail: boolean;
  orderDeliveredEmail: boolean;
  refundNotificationEmail: boolean;
  vendorApprovalEmail: boolean;
  vendorRejectionEmail: boolean;
  // Security
  enableTwoFactorAuth: boolean;
  enableIpWhitelist: boolean;
  ipWhitelist: string;
  sessionTimeout: string;
  passwordMinLength: string;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  enableMaintenanceMode: boolean;
  maintenanceMessage: string;
}

const DEFAULT_SETTINGS: Settings = {
  storeName: 'SmartMart',
  storeEmail: CONTACT.email,
  storePhone: CONTACT.phone,
  storeAddress: '',
  storeCountry: 'GH',
  storeCurrency: 'GHS',
  storeTimezone: 'Africa/Accra',
  storeLogo: '',
  storeDescription: '',
  enablePaystack: true,
  enableStripe: true,
  enableFlutterwave: true,
  enableHubtel: true,
  enableCashOnDelivery: false,
  paystackPublicKey: '',
  paystackSecretKey: '',
  stripePublicKey: '',
  stripeSecretKey: '',
  flutterwavePublicKey: '',
  flutterwaveSecretKey: '',
  hubtelClientId: '',
  hubtelClientSecret: '',
  enableFreeShipping: true,
  freeShippingThreshold: '200',
  flatRateShipping: '15',
  enableLocalPickup: false,
  localPickupFee: '0',
  enableInternationalShipping: false,
  internationalShippingRate: '50',
  shippingOriginAddress: '',
  enableTaxCollection: true,
  taxRate: '15',
  taxInclusive: false,
  enableTaxByState: false,
  defaultTaxClass: 'standard',
  enableEmailNotifications: true,
  enableSmsNotifications: false,
  enablePushNotifications: false,
  orderConfirmationEmail: true,
  orderShippedEmail: true,
  orderDeliveredEmail: true,
  refundNotificationEmail: true,
  vendorApprovalEmail: true,
  vendorRejectionEmail: true,
  enableTwoFactorAuth: false,
  enableIpWhitelist: false,
  ipWhitelist: '',
  sessionTimeout: '30',
  passwordMinLength: '8',
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,
  enableMaintenanceMode: false,
  maintenanceMessage: 'We are currently performing maintenance. We will be back shortly.',
};

// ============================================================================
// UI Components
// ============================================================================

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3">
      <div className="mb-1.5">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  type = 'text',
  placeholder = '',
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ============================================================================
// Tab definitions
// ============================================================================

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'payment', label: 'Payment', icon: '💳' },
  { id: 'shipping', label: 'Shipping', icon: '🚚' },
  { id: 'tax', label: 'Tax', icon: '📊' },
  { id: 'notification', label: 'Notification', icon: '🔔' },
  { id: 'security', label: 'Security', icon: '🔒' },
];

// ============================================================================
// Main Page Component
// ============================================================================

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);

  // Initialize Supabase client
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anonKey) {
      setSupabase(createClient(url, anonKey));
    } else {
      // No env vars — run in offline/default mode
      setLoading(false);
    }
  }, []);

  // Load settings from Supabase
  const loadSettings = useCallback(async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .eq('namespace', 'admin');
      if (error) throw error;
      if (data && data.length > 0) {
        const map: Record<string, string> = {};
        for (const row of data as { key: string; value: string }[]) {
          map[row.key] = row.value;
        }
        setSettings((prev) => ({
          ...prev,
          storeName: map.storeName ?? prev.storeName,
          storeEmail: map.storeEmail ?? prev.storeEmail,
          storePhone: map.storePhone ?? prev.storePhone,
          storeAddress: map.storeAddress ?? prev.storeAddress,
          storeCountry: map.storeCountry ?? prev.storeCountry,
          storeCurrency: map.storeCurrency ?? prev.storeCurrency,
          storeTimezone: map.storeTimezone ?? prev.storeTimezone,
          storeLogo: map.storeLogo ?? prev.storeLogo,
          storeDescription: map.storeDescription ?? prev.storeDescription,
          enablePaystack: map.enablePaystack === 'true',
          enableStripe: map.enableStripe === 'true',
          enableFlutterwave: map.enableFlutterwave === 'true',
          enableHubtel: map.enableHubtel === 'true',
          enableCashOnDelivery: map.enableCashOnDelivery === 'true',
          paystackPublicKey: map.paystackPublicKey ?? '',
          paystackSecretKey: map.paystackSecretKey ?? '',
          stripePublicKey: map.stripePublicKey ?? '',
          stripeSecretKey: map.stripeSecretKey ?? '',
          flutterwavePublicKey: map.flutterwavePublicKey ?? '',
          flutterwaveSecretKey: map.flutterwaveSecretKey ?? '',
          hubtelClientId: map.hubtelClientId ?? '',
          hubtelClientSecret: map.hubtelClientSecret ?? '',
          enableFreeShipping: map.enableFreeShipping === 'true',
          freeShippingThreshold: map.freeShippingThreshold ?? prev.freeShippingThreshold,
          flatRateShipping: map.flatRateShipping ?? prev.flatRateShipping,
          enableLocalPickup: map.enableLocalPickup === 'true',
          localPickupFee: map.localPickupFee ?? prev.localPickupFee,
          enableInternationalShipping: map.enableInternationalShipping === 'true',
          internationalShippingRate: map.internationalShippingRate ?? prev.internationalShippingRate,
          shippingOriginAddress: map.shippingOriginAddress ?? prev.shippingOriginAddress,
          enableTaxCollection: map.enableTaxCollection === 'true',
          taxRate: map.taxRate ?? prev.taxRate,
          taxInclusive: map.taxInclusive === 'true',
          enableTaxByState: map.enableTaxByState === 'true',
          defaultTaxClass: map.defaultTaxClass ?? prev.defaultTaxClass,
          enableEmailNotifications: map.enableEmailNotifications === 'true',
          enableSmsNotifications: map.enableSmsNotifications === 'true',
          enablePushNotifications: map.enablePushNotifications === 'true',
          orderConfirmationEmail: map.orderConfirmationEmail === 'true',
          orderShippedEmail: map.orderShippedEmail === 'true',
          orderDeliveredEmail: map.orderDeliveredEmail === 'true',
          refundNotificationEmail: map.refundNotificationEmail === 'true',
          vendorApprovalEmail: map.vendorApprovalEmail === 'true',
          vendorRejectionEmail: map.vendorRejectionEmail === 'true',
          enableTwoFactorAuth: map.enableTwoFactorAuth === 'true',
          enableIpWhitelist: map.enableIpWhitelist === 'true',
          ipWhitelist: map.ipWhitelist ?? '',
          sessionTimeout: map.sessionTimeout ?? prev.sessionTimeout,
          passwordMinLength: map.passwordMinLength ?? prev.passwordMinLength,
          passwordRequireUppercase: map.passwordRequireUppercase === 'true',
          passwordRequireNumbers: map.passwordRequireNumbers === 'true',
          passwordRequireSymbols: map.passwordRequireSymbols === 'true',
          enableMaintenanceMode: map.enableMaintenanceMode === 'true',
          maintenanceMessage: map.maintenanceMessage ?? prev.maintenanceMessage,
        }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (supabase) loadSettings();
  }, [supabase, loadSettings]);

  // Save settings
  const saveSettings = useCallback(async () => {
    if (!supabase) {
      setMessage({ type: 'success', text: 'Settings saved locally (no Supabase configured).' });
      return;
    }
    try {
      setSaving(true);
      const entries = Object.entries(settings).map(([key, value]) => ({
        namespace: 'admin',
        key,
        value: String(value),
      }));
      // Upsert each entry
      for (const entry of entries) {
        const { error } = await supabase
          .from('settings')
          .upsert(entry as any, { onConflict: 'namespace,key' });
        if (error) throw error;
      }
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  }, [supabase, settings]);

  // Update helper
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your store configuration, payments, shipping, and security.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {message && (
                <span
                  className={`text-sm font-medium ${
                    message.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {message.text}
                </span>
              )}
              <button
                type="button"
                onClick={saveSettings}
                disabled={saving || loading}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Tabs Sidebar */}
          <nav className="lg:w-56 flex-shrink-0">
            <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
              {TABS.map((tab) => (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Tab Content */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            )}

            {!loading && activeTab === 'general' && (
              <div className="space-y-1 divide-y divide-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 pb-4">General Settings</h2>
                <SettingRow label="Store Name" description="The public name of your store.">
                  <TextInput
                    value={settings.storeName}
                    onChange={(v) => update('storeName', v)}
                    placeholder="SmartMart"
                  />
                </SettingRow>
                <SettingRow label="Store Email" description="Primary contact email for your store.">
                  <TextInput
                    value={settings.storeEmail}
                    onChange={(v) => update('storeEmail', v)}
                    placeholder={CONTACT.email}
                  />
                </SettingRow>
                <SettingRow label="Store Phone" description="Primary contact phone number.">
                  <TextInput
                    value={settings.storePhone}
                    onChange={(v) => update('storePhone', v)}
                    placeholder={CONTACT.phone}
                  />
                </SettingRow>
                <SettingRow label="Store Address" description="Physical address of your store.">
                  <TextInput
                    value={settings.storeAddress}
                    onChange={(v) => update('storeAddress', v)}
                    placeholder="123 Main St, Accra, Ghana"
                  />
                </SettingRow>
                <SettingRow label="Country" description="Country where your store operates.">
                  <SelectInput
                    value={settings.storeCountry}
                    onChange={(v) => update('storeCountry', v)}
                    options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
                  />
                </SettingRow>
                <SettingRow label="Currency" description="Default currency for transactions.">
                  <SelectInput
                    value={settings.storeCurrency}
                    onChange={(v) => update('storeCurrency', v)}
                    options={COUNTRIES.map((c) => ({ value: c.currency, label: `${c.name} (${c.currency})` }))}
                  />
                </SettingRow>
                <SettingRow label="Timezone" description="Timezone for order timestamps and reports.">
                  <TextInput
                    value={settings.storeTimezone}
                    onChange={(v) => update('storeTimezone', v)}
                    placeholder="Africa/Accra"
                  />
                </SettingRow>
                <SettingRow label="Store Logo URL" description="URL to your store logo image.">
                  <TextInput
                    value={settings.storeLogo}
                    onChange={(v) => update('storeLogo', v)}
                    placeholder="https://res.cloudinary.com/..."
                  />
                </SettingRow>
                <SettingRow label="Store Description" description="Short description shown in SEO and footer.">
                  <TextInput
                    value={settings.storeDescription}
                    onChange={(v) => update('storeDescription', v)}
                    placeholder="Your one-stop shop for everything."
                  />
                </SettingRow>
              </div>
            )}

            {!loading && activeTab === 'payment' && (
              <div className="space-y-1 divide-y divide-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 pb-4">Payment Settings</h2>
                <Toggle
                  label="Paystack"
                  description="Enable Paystack payment gateway for African customers."
                  checked={settings.enablePaystack}
                  onChange={(v) => update('enablePaystack', v)}
                />
                {settings.enablePaystack && (
                  <>
                    <SettingRow label="Paystack Public Key">
                      <TextInput
                        value={settings.paystackPublicKey}
                        onChange={(v) => update('paystackPublicKey', v)}
                        placeholder="pk_test_..."
                      />
                    </SettingRow>
                    <SettingRow label="Paystack Secret Key">
                      <TextInput
                        value={settings.paystackSecretKey}
                        onChange={(v) => update('paystackSecretKey', v)}
                        type="password"
                        placeholder="sk_test_..."
                      />
                    </SettingRow>
                  </>
                )}
                <Toggle
                  label="Stripe"
                  description="Enable Stripe for international card payments."
                  checked={settings.enableStripe}
                  onChange={(v) => update('enableStripe', v)}
                />
                {settings.enableStripe && (
                  <>
                    <SettingRow label="Stripe Public Key">
                      <TextInput
                        value={settings.stripePublicKey}
                        onChange={(v) => update('stripePublicKey', v)}
                        placeholder="pk_live_..."
                      />
                    </SettingRow>
                    <SettingRow label="Stripe Secret Key">
                      <TextInput
                        value={settings.stripeSecretKey}
                        onChange={(v) => update('stripeSecretKey', v)}
                        type="password"
                        placeholder="sk_live_..."
                      />
                    </SettingRow>
                  </>
                )}
                <Toggle
                  label="Flutterwave"
                  description="Enable Flutterwave payment gateway."
                  checked={settings.enableFlutterwave}
                  onChange={(v) => update('enableFlutterwave', v)}
                />
                {settings.enableFlutterwave && (
                  <>
                    <SettingRow label="Flutterwave Public Key">
                      <TextInput
                        value={settings.flutterwavePublicKey}
                        onChange={(v) => update('flutterwavePublicKey', v)}
                        placeholder="FLWPUBK-..."
                      />
                    </SettingRow>
                    <SettingRow label="Flutterwave Secret Key">
                      <TextInput
                        value={settings.flutterwaveSecretKey}
                        onChange={(v) => update('flutterwaveSecretKey', v)}
                        type="password"
                        placeholder="FLWSECK-..."
                      />
                    </SettingRow>
                  </>
                )}
                <Toggle
                  label="Hubtel"
                  description="Enable Hubtel mobile money payments (Ghana)."
                  checked={settings.enableHubtel}
                  onChange={(v) => update('enableHubtel', v)}
                />
                {settings.enableHubtel && (
                  <>
                    <SettingRow label="Hubtel Client ID">
                      <TextInput
                        value={settings.hubtelClientId}
                        onChange={(v) => update('hubtelClientId', v)}
                      />
                    </SettingRow>
                    <SettingRow label="Hubtel Client Secret">
                      <TextInput
                        value={settings.hubtelClientSecret}
                        onChange={(v) => update('hubtelClientSecret', v)}
                        type="password"
                      />
                    </SettingRow>
                  </>
                )}
                <Toggle
                  label="Cash on Delivery"
                  description="Allow customers to pay with cash when their order is delivered."
                  checked={settings.enableCashOnDelivery}
                  onChange={(v) => update('enableCashOnDelivery', v)}
                />
              </div>
            )}

            {!loading && activeTab === 'shipping' && (
              <div className="space-y-1 divide-y divide-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 pb-4">Shipping Settings</h2>
                <Toggle
                  label="Free Shipping"
                  description="Offer free shipping on orders above a threshold."
                  checked={settings.enableFreeShipping}
                  onChange={(v) => update('enableFreeShipping', v)}
                />
                {settings.enableFreeShipping && (
                  <SettingRow label="Free Shipping Threshold" description="Orders above this amount get free shipping.">
                    <TextInput
                      value={settings.freeShippingThreshold}
                      onChange={(v) => update('freeShippingThreshold', v)}
                      type="number"
                      placeholder="200"
                    />
                  </SettingRow>
                )}
                <SettingRow label="Flat Rate Shipping" description="Standard shipping rate for all orders.">
                  <TextInput
                    value={settings.flatRateShipping}
                    onChange={(v) => update('flatRateShipping', v)}
                    type="number"
                    placeholder="15"
                  />
                </SettingRow>
                <Toggle
                  label="Local Pickup"
                  description="Allow customers to pick up orders from your store."
                  checked={settings.enableLocalPickup}
                  onChange={(v) => update('enableLocalPickup', v)}
                />
                {settings.enableLocalPickup && (
                  <SettingRow label="Local Pickup Fee" description="Fee charged for local pickup (0 for free).">
                    <TextInput
                      value={settings.localPickupFee}
                      onChange={(v) => update('localPickupFee', v)}
                      type="number"
                      placeholder="0"
                    />
                  </SettingRow>
                )}
                <Toggle
                  label="International Shipping"
                  description="Enable shipping to international destinations."
                  checked={settings.enableInternationalShipping}
                  onChange={(v) => update('enableInternationalShipping', v)}
                />
                {settings.enableInternationalShipping && (
                  <SettingRow label="International Shipping Rate" description="Flat rate for international orders.">
                    <TextInput
                      value={settings.internationalShippingRate}
                      onChange={(v) => update('internationalShippingRate', v)}
                      type="number"
                      placeholder="50"
                    />
                  </SettingRow>
                )}
                <SettingRow label="Shipping Origin Address" description="The address orders ship from.">
                  <TextInput
                    value={settings.shippingOriginAddress}
                    onChange={(v) => update('shippingOriginAddress', v)}
                    placeholder="123 Main St, Accra, Ghana"
                  />
                </SettingRow>
              </div>
            )}

            {!loading && activeTab === 'tax' && (
              <div className="space-y-1 divide-y divide-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 pb-4">Tax Settings</h2>
                <Toggle
                  label="Enable Tax Collection"
                  description="Automatically collect tax on orders."
                  checked={settings.enableTaxCollection}
                  onChange={(v) => update('enableTaxCollection', v)}
                />
                {settings.enableTaxCollection && (
                  <>
                    <SettingRow label="Default Tax Rate (%)" description="Percentage tax applied to all orders.">
                      <TextInput
                        value={settings.taxRate}
                        onChange={(v) => update('taxRate', v)}
                        type="number"
                        placeholder="15"
                      />
                    </SettingRow>
                    <Toggle
                      label="Tax Inclusive"
                      description="Prices already include tax (tax is not added at checkout)."
                      checked={settings.taxInclusive}
                      onChange={(v) => update('taxInclusive', v)}
                    />
                    <Toggle
                      label="Tax by State/Region"
                      description="Apply different tax rates based on customer location."
                      checked={settings.enableTaxByState}
                      onChange={(v) => update('enableTaxByState', v)}
                    />
                    <SettingRow label="Default Tax Class" description="Tax classification for products.">
                      <SelectInput
                        value={settings.defaultTaxClass}
                        onChange={(v) => update('defaultTaxClass', v)}
                        options={[
                          { value: 'standard', label: 'Standard' },
                          { value: 'reduced', label: 'Reduced' },
                          { value: 'zero', label: 'Zero Rate' },
                          { value: 'exempt', label: 'Exempt' },
                        ]}
                      />
                    </SettingRow>
                  </>
                )}
              </div>
            )}

            {!loading && activeTab === 'notification' && (
              <div className="space-y-1 divide-y divide-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 pb-4">Notification Settings</h2>
                <Toggle
                  label="Email Notifications"
                  description="Send transactional emails to customers and vendors."
                  checked={settings.enableEmailNotifications}
                  onChange={(v) => update('enableEmailNotifications', v)}
                />
                <Toggle
                  label="SMS Notifications"
                  description="Send order updates via SMS."
                  checked={settings.enableSmsNotifications}
                  onChange={(v) => update('enableSmsNotifications', v)}
                />
                <Toggle
                  label="Push Notifications"
                  description="Send browser push notifications."
                  checked={settings.enablePushNotifications}
                  onChange={(v) => update('enablePushNotifications', v)}
                />
                <div className="pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Email Types</h3>
                </div>
                <Toggle
                  label="Order Confirmation"
                  description="Email sent when an order is placed."
                  checked={settings.orderConfirmationEmail}
                  onChange={(v) => update('orderConfirmationEmail', v)}
                />
                <Toggle
                  label="Order Shipped"
                  description="Email sent when an order is shipped."
                  checked={settings.orderShippedEmail}
                  onChange={(v) => update('orderShippedEmail', v)}
                />
                <Toggle
                  label="Order Delivered"
                  description="Email sent when an order is delivered."
                  checked={settings.orderDeliveredEmail}
                  onChange={(v) => update('orderDeliveredEmail', v)}
                />
                <Toggle
                  label="Refund Notification"
                  description="Email sent when a refund is processed."
                  checked={settings.refundNotificationEmail}
                  onChange={(v) => update('refundNotificationEmail', v)}
                />
                <Toggle
                  label="Vendor Approval"
                  description="Email sent when a vendor application is approved."
                  checked={settings.vendorApprovalEmail}
                  onChange={(v) => update('vendorApprovalEmail', v)}
                />
                <Toggle
                  label="Vendor Rejection"
                  description="Email sent when a vendor application is rejected."
                  checked={settings.vendorRejectionEmail}
                  onChange={(v) => update('vendorRejectionEmail', v)}
                />
              </div>
            )}

            {!loading && activeTab === 'security' && (
              <div className="space-y-1 divide-y divide-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 pb-4">Security Settings</h2>
                <Toggle
                  label="Two-Factor Authentication"
                  description="Require 2FA for all admin and vendor accounts."
                  checked={settings.enableTwoFactorAuth}
                  onChange={(v) => update('enableTwoFactorAuth', v)}
                />
                <Toggle
                  label="IP Whitelist"
                  description="Restrict admin access to whitelisted IP addresses."
                  checked={settings.enableIpWhitelist}
                  onChange={(v) => update('enableIpWhitelist', v)}
                />
                {settings.enableIpWhitelist && (
                  <SettingRow label="Whitelisted IPs" description="Comma-separated list of allowed IP addresses.">
                    <TextInput
                      value={settings.ipWhitelist}
                      onChange={(v) => update('ipWhitelist', v)}
                      placeholder="192.168.1.1, 10.0.0.1"
                    />
                  </SettingRow>
                )}
                <SettingRow label="Session Timeout (minutes)" description="Automatically log out after this period of inactivity.">
                  <TextInput
                    value={settings.sessionTimeout}
                    onChange={(v) => update('sessionTimeout', v)}
                    type="number"
                    placeholder="30"
                  />
                </SettingRow>
                <SettingRow label="Minimum Password Length" description="Minimum characters required for passwords.">
                  <TextInput
                    value={settings.passwordMinLength}
                    onChange={(v) => update('passwordMinLength', v)}
                    type="number"
                    placeholder="8"
                  />
                </SettingRow>
                <Toggle
                  label="Require Uppercase"
                  description="Passwords must contain at least one uppercase letter."
                  checked={settings.passwordRequireUppercase}
                  onChange={(v) => update('passwordRequireUppercase', v)}
                />
                <Toggle
                  label="Require Numbers"
                  description="Passwords must contain at least one number."
                  checked={settings.passwordRequireNumbers}
                  onChange={(v) => update('passwordRequireNumbers', v)}
                />
                <Toggle
                  label="Require Symbols"
                  description="Passwords must contain at least one special character."
                  checked={settings.passwordRequireSymbols}
                  onChange={(v) => update('passwordRequireSymbols', v)}
                />

                {/* Danger Zone */}
                <div className="mt-8 rounded-lg border-2 border-red-200 bg-red-50 p-6">
                  <h3 className="text-base font-semibold text-red-900 mb-1">⚠️ Danger Zone</h3>
                  <p className="text-sm text-red-700 mb-4">
                    These settings can take your store offline. Proceed with caution.
                  </p>
                  <Toggle
                    label="Maintenance Mode"
                    description="When enabled, the storefront shows a maintenance page and blocks new orders."
                    checked={settings.enableMaintenanceMode}
                    onChange={(v) => update('enableMaintenanceMode', v)}
                  />
                  {settings.enableMaintenanceMode && (
                    <SettingRow label="Maintenance Message" description="Message displayed to visitors during maintenance.">
                      <TextInput
                        value={settings.maintenanceMessage}
                        onChange={(v) => update('maintenanceMessage', v)}
                        placeholder="We are currently performing maintenance. We will be back shortly."
                      />
                    </SettingRow>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
