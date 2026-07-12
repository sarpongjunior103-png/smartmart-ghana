'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

dynamic(() => Promise.resolve(() => null), { ssr: false });

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }
  return supabaseClient;
}

type Setting = {
  id: string;
  key: string;
  value: any;
  category: string;
  description: string | null;
  is_public: boolean;
  updated_at: string;
};

const CATEGORIES = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'payment', label: 'Payments', icon: '💳' },
  { id: 'shipping', label: 'Shipping', icon: '🚚' },
  { id: 'tax', label: 'Tax', icon: '📊' },
  { id: 'notification', label: 'Notifications', icon: '🔔' },
  { id: 'security', label: 'Security', icon: '🔒' },
] as const;

const COUNTRIES = [
  { code: 'GH', name: 'Ghana', currency: 'GHS' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  { code: 'KE', name: 'Kenya', currency: 'KES' },
  { code: 'CI', name: "Côte d'Ivoire", currency: 'XOF' },
  { code: 'SN', name: 'Senegal', currency: 'XOF' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
  { code: 'EG', name: 'Egypt', currency: 'EGP' },
  { code: 'MA', name: 'Morocco', currency: 'MAD' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS' },
  { code: 'UG', name: 'Uganda', currency: 'UGX' },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getSupabase()
      .from('platform_settings')
      .select('*')
      .order('category, key');

    if (error) {
      setError(error.message);
    } else if (data) {
      const map: Record<string, Setting> = {};
      data.forEach((s: Setting) => {
        map[s.key] = s;
      });
      setSettings(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const updates = Object.values(settings).map((s) => ({
      id: s.id,
      key: s.key,
      value: s.value,
      category: s.category,
    })) as any[];

    const { error } = await getSupabase()
      .from('platform_settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Settings saved successfully.');
      setTimeout(() => setSuccess(null), 3000);
    }
    setSaving(false);
  };

  const getSetting = (key: string, fallback: any = '') => {
    return settings[key]?.value ?? fallback;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">Platform Settings</h1>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Admin</span>
            </div>
            <div className="flex items-center gap-3">
              {success && <span className="text-sm text-green-600 font-medium">{success}</span>}
              <button
                onClick={saveSettings}
                disabled={saving || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-56 flex-shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === cat.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-400">Loading settings...</div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {activeTab === 'general' && (
                  <GeneralSettings getSetting={getSetting} updateSetting={updateSetting} settings={settings} />
                )}
                {activeTab === 'payment' && <PaymentSettings getSetting={getSetting} updateSetting={updateSetting} />}
                {activeTab === 'shipping' && <ShippingSettings getSetting={getSetting} updateSetting={updateSetting} />}
                {activeTab === 'tax' && <TaxSettings getSetting={getSetting} updateSetting={updateSetting} />}
                {activeTab === 'notification' && <NotificationSettings getSetting={getSetting} updateSetting={updateSetting} />}
                {activeTab === 'security' && <SecuritySettings getSetting={getSetting} updateSetting={updateSetting} />}
              </div>
            )}

            <div className="mt-6 bg-white rounded-xl border border-red-200 p-6">
              <h3 className="text-sm font-semibold text-red-600 mb-4">Danger Zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Maintenance Mode</p>
                  <p className="text-xs text-gray-500 mt-1">When enabled, only admin users can access the site.</p>
                </div>
                <Toggle checked={getSetting('maintenance_mode', false) === true} onChange={(v) => updateSetting('maintenance_mode', v)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="sm:w-64 flex-shrink-0">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, type = 'text', placeholder }: { value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function GeneralSettings({ getSetting, updateSetting }: { getSetting: (k: string, f?: any) => any; updateSetting: (k: string, v: any) => void; settings: Record<string, Setting> }) {
  return (
    <>
      <SettingRow label="Site Name" description="The display name for the platform">
        <TextInput value={getSetting('site_name', 'SmartMart Ghana')} onChange={(v) => updateSetting('site_name', JSON.stringify(v))} />
      </SettingRow>
      <SettingRow label="Default Currency" description="Primary currency for transactions">
        <SelectInput
          value={getSetting('default_currency', 'GHS')}
          onChange={(v) => updateSetting('default_currency', JSON.stringify(v))}
          options={[
            { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
            { value: 'NGN', label: 'NGN - Nigerian Naira' },
            { value: 'KES', label: 'KES - Kenyan Shilling' },
            { value: 'ZAR', label: 'ZAR - South African Rand' },
            { value: 'EGP', label: 'EGP - Egyptian Pound' },
            { value: 'XOF', label: 'XOF - West African CFA Franc' },
          ]}
        />
      </SettingRow>
      <SettingRow label="Default Country" description="Primary operating country">
        <SelectInput
          value={getSetting('default_country', 'Ghana')}
          onChange={(v) => updateSetting('default_country', JSON.stringify(v))}
          options={COUNTRIES.map((c) => ({ value: c.name, label: c.name }))}
        />
      </SettingRow>
      <SettingRow label="Commission Rate (%)" description="Platform commission on each sale">
        <TextInput type="number" value={getSetting('commission_rate', 5.0)} onChange={(v) => updateSetting('commission_rate', parseFloat(v) || 0)} />
      </SettingRow>
      <SettingRow label="Min Payout (GHS)" description="Minimum amount for vendor payout requests">
        <TextInput type="number" value={getSetting('min_payout_amount', 50)} onChange={(v) => updateSetting('min_payout_amount', parseFloat(v) || 0)} />
      </SettingRow>
      <SettingRow label="Max Payout (GHS)" description="Maximum amount per payout request">
        <TextInput type="number" value={getSetting('max_payout_amount', 10000)} onChange={(v) => updateSetting('max_payout_amount', parseFloat(v) || 0)} />
      </SettingRow>
      <SettingRow label="Allow Vendor Registration" description="Whether new vendors can sign up">
        <Toggle checked={getSetting('allow_vendor_registration', true) === true} onChange={(v) => updateSetting('allow_vendor_registration', v)} />
      </SettingRow>
      <SettingRow label="Product Approval Required" description="Products need admin approval before going live">
        <Toggle checked={getSetting('product_approval_required', true) === true} onChange={(v) => updateSetting('product_approval_required', v)} />
      </SettingRow>
      <SettingRow label="Max Product Images" description="Maximum images per product listing">
        <TextInput type="number" value={getSetting('max_product_images', 8)} onChange={(v) => updateSetting('max_product_images', parseInt(v) || 1)} />
      </SettingRow>
      <SettingRow label="Max File Upload (MB)" description="Maximum file upload size">
        <TextInput type="number" value={getSetting('max_file_upload_mb', 10)} onChange={(v) => updateSetting('max_file_upload_mb', parseInt(v) || 1)} />
      </SettingRow>
    </>
  );
}

function PaymentSettings({ getSetting, updateSetting }: { getSetting: (k: string, f?: any) => any; updateSetting: (k: string, v: any) => void }) {
  const gateways = [
    { key: 'paystack', label: 'Paystack' },
    { key: 'flutterwave', label: 'Flutterwave' },
    { key: 'hubtel', label: 'Hubtel' },
    { key: 'stripe', label: 'Stripe' },
  ];
  return (
    <>
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Payment Gateways</h3>
        <p className="text-xs text-gray-500 mt-1">Configure which payment gateways are available at checkout. API keys are set in environment variables.</p>
      </div>
      {gateways.map((g) => (
        <SettingRow key={g.key} label={g.label} description={`Enable ${g.label} as a payment option`}>
          <Toggle checked={getSetting(`payment_${g.key}_enabled`, true) === true} onChange={(v) => updateSetting(`payment_${g.key}_enabled`, v)} />
        </SettingRow>
      ))}
      <SettingRow label="Default Gateway" description="Primary gateway shown at checkout">
        <SelectInput
          value={getSetting('default_payment_gateway', 'paystack')}
          onChange={(v) => updateSetting('default_payment_gateway', JSON.stringify(v))}
          options={gateways.map((g) => ({ value: g.key, label: g.label }))}
        />
      </SettingRow>
    </>
  );
}

function ShippingSettings({ getSetting, updateSetting }: { getSetting: (k: string, f?: any) => any; updateSetting: (k: string, v: any) => void }) {
  return (
    <>
      <SettingRow label="Flat Shipping Rate" description="Default shipping cost in default currency">
        <TextInput type="number" value={getSetting('shipping_flat_rate', 10)} onChange={(v) => updateSetting('shipping_flat_rate', parseFloat(v) || 0)} />
      </SettingRow>
      <SettingRow label="Free Shipping Threshold" description="Orders above this amount get free shipping">
        <TextInput type="number" value={getSetting('free_shipping_threshold', 200)} onChange={(v) => updateSetting('free_shipping_threshold', parseFloat(v) || 0)} />
      </SettingRow>
      <SettingRow label="Estimated Delivery Days" description="Default estimated delivery time">
        <TextInput type="number" value={getSetting('estimated_delivery_days', 5)} onChange={(v) => updateSetting('estimated_delivery_days', parseInt(v) || 1)} />
      </SettingRow>
    </>
  );
}

function TaxSettings({ getSetting, updateSetting }: { getSetting: (k: string, f?: any) => any; updateSetting: (k: string, v: any) => void }) {
  return (
    <>
      <SettingRow label="Enable Tax Calculation" description="Calculate tax at checkout">
        <Toggle checked={getSetting('tax_enabled', true) === true} onChange={(v) => updateSetting('tax_enabled', v)} />
      </SettingRow>
      <SettingRow label="Default Tax Rate (%)" description="Tax percentage applied to order subtotal">
        <TextInput type="number" value={getSetting('tax_rate', 2.5)} onChange={(v) => updateSetting('tax_rate', parseFloat(v) || 0)} />
      </SettingRow>
      <SettingRow label="Tax Inclusive" description="Prices already include tax (not added at checkout)">
        <Toggle checked={getSetting('tax_inclusive', false) === true} onChange={(v) => updateSetting('tax_inclusive', v)} />
      </SettingRow>
    </>
  );
}

function NotificationSettings({ getSetting, updateSetting }: { getSetting: (k: string, f?: any) => any; updateSetting: (k: string, v: any) => void }) {
  return (
    <>
      <SettingRow label="Email Notifications" description="Send transactional emails (orders, shipping, etc.)">
        <Toggle checked={getSetting('email_notifications', true) === true} onChange={(v) => updateSetting('email_notifications', v)} />
      </SettingRow>
      <SettingRow label="SMS Notifications" description="Send SMS for order updates and OTP">
        <Toggle checked={getSetting('sms_notifications', true) === true} onChange={(v) => updateSetting('sms_notifications', v)} />
      </SettingRow>
      <SettingRow label="Push Notifications" description="Send browser push notifications">
        <Toggle checked={getSetting('push_notifications', false) === true} onChange={(v) => updateSetting('push_notifications', v)} />
      </SettingRow>
    </>
  );
}

function SecuritySettings({ getSetting, updateSetting }: { getSetting: (k: string, f?: any) => any; updateSetting: (k: string, v: any) => void }) {
  return (
    <>
      <SettingRow label="Require 2FA (All Users)" description="Force two-factor authentication for all accounts">
        <Toggle checked={getSetting('require_2fa', false) === true} onChange={(v) => updateSetting('require_2fa', v)} />
      </SettingRow>
      <SettingRow label="Require 2FA (Admins)" description="Force 2FA for admin accounts">
        <Toggle checked={getSetting('require_2fa_admin', true) === true} onChange={(v) => updateSetting('require_2fa_admin', v)} />
      </SettingRow>
      <SettingRow label="Rate Limit (req/min)" description="Maximum API requests per minute per user">
        <TextInput type="number" value={getSetting('rate_limit_max', 100)} onChange={(v) => updateSetting('rate_limit_max', parseInt(v) || 1)} />
      </SettingRow>
      <SettingRow label="Session Timeout (hours)" description="How long before a session expires">
        <TextInput type="number" value={getSetting('session_timeout_hours', 24)} onChange={(v) => updateSetting('session_timeout_hours', parseInt(v) || 1)} />
      </SettingRow>
    </>
  );
}
