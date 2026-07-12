import { CONTACT } from '@/lib/contact';

export const metadata = {
  title: 'Privacy Policy — SmartMart Ghana',
  description: 'Read the SmartMart Ghana privacy policy to understand how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
          <p className="text-sm text-gray-400">Last updated: {new Date().getFullYear()}</p>

          <h2 className="text-2xl font-semibold text-gray-900">1. Information We Collect</h2>
          <p>
            SmartMart Ghana collects information you provide when you create an account, place an order,
            or contact us. This includes your name, email address, phone number, shipping address, and
            payment information. We also collect usage data such as browsing history and device information.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">2. How We Use Your Information</h2>
          <p>
            We use your information to process orders, communicate with you about your purchases, provide
            customer support, improve our services, and send promotional communications (with your consent).
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">3. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including encryption,
            secure socket layer (SSL) technology, and strict access controls. Payment information is processed
            through certified payment gateways (Paystack, Flutterwave, Hubtel, Stripe) and is not stored on our servers.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">4. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as necessary to provide our
            services, comply with legal obligations, resolve disputes, and enforce our agreements.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">5. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. You may also opt out of
            marketing communications at any time. To exercise these rights, please contact us using the
            information below.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">6. Cookies</h2>
          <p>
            We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
            You can control cookies through your browser settings.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">7. Third-Party Services</h2>
          <p>
            We use third-party services including Supabase (database), Cloudinary (image storage), Resend (email),
            and payment gateways. Each service has its own privacy policy governing the use of your data.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Phone: <a href={`tel:${CONTACT.phoneRaw}`} className="text-blue-600 hover:underline">{CONTACT.phone}</a>
            </li>
            <li>
              Email: <a href={`mailto:${CONTACT.email}`} className="text-blue-600 hover:underline">{CONTACT.email}</a>
            </li>
            <li>Address: {CONTACT.address}</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
