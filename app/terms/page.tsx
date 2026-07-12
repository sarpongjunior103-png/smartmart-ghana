import { CONTACT } from '@/lib/contact';

export const metadata = {
  title: 'Terms & Conditions — SmartMart Ghana',
  description: 'Read the SmartMart Ghana terms and conditions governing the use of our marketplace platform.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms &amp; Conditions</h1>
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
          <p className="text-sm text-gray-400">Last updated: {new Date().getFullYear()}</p>

          <h2 className="text-2xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
          <p>
            By accessing and using SmartMart Ghana, you accept and agree to be bound by these Terms and Conditions.
            If you do not agree, please do not use our platform.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">2. User Accounts</h2>
          <p>
            You must create an account to make purchases or sell products on SmartMart Ghana. You are responsible
            for maintaining the confidentiality of your account credentials and for all activities under your account.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">3. Vendor Terms</h2>
          <p>
            Vendors must provide accurate product information, maintain adequate inventory, fulfill orders promptly,
            and adhere to our quality standards. SmartMart Ghana reserves the right to suspend or terminate vendor
            accounts that violate these terms.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">4. Orders and Payments</h2>
          <p>
            All orders are subject to product availability. We accept payments via Paystack, Flutterwave, Hubtel,
            and Stripe. Prices are listed in Ghanaian Cedis (GHS) unless otherwise specified. A platform commission
            applies to each vendor sale.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">5. Shipping and Returns</h2>
          <p>
            Shipping costs and delivery times vary by location. Returns are accepted within 7 days of delivery
            for eligible items. Refunds are processed to the original payment method within 5-10 business days.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">6. Limitation of Liability</h2>
          <p>
            SmartMart Ghana is not liable for indirect, incidental, or consequential damages arising from the use
            of our platform. Our total liability shall not exceed the amount paid for the specific transaction.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">7. Intellectual Property</h2>
          <p>
            All content on SmartMart Ghana, including logos, text, and graphics, is the property of SmartMart Ghana
            and is protected by intellectual property laws.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900">8. Contact Us</h2>
          <p>
            If you have any questions about these Terms &amp; Conditions, please contact us:
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
