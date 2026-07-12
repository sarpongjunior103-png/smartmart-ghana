import { CONTACT } from '@/lib/contact';

export const metadata = {
  title: 'Vendor Support — SmartMart Ghana',
  description: 'Support resources for SmartMart Ghana vendors.',
};

export default function VendorSupportPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Vendor Support</h1>
        <p className="text-gray-600 mb-8 text-lg">
          We&apos;re committed to helping our vendors succeed. Reach out to us with any questions about
          your store, products, payouts, or orders.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Vendor Support</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <span className="font-medium text-gray-900">Phone: </span>
                <a href={`tel:${CONTACT.phoneRaw}`} className="text-blue-600 hover:underline">
                  {CONTACT.phone}
                </a>
              </p>
              <p>
                <span className="font-medium text-gray-900">Email: </span>
                <a href={`mailto:${CONTACT.email}`} className="text-blue-600 hover:underline">
                  {CONTACT.email}
                </a>
              </p>
              <p>Available Monday to Friday, 8:00 AM — 6:00 PM GMT</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Vendor Resources</h2>
            <ul className="space-y-2 text-gray-600">
              <li><a href="/docs/vendor-guide" className="text-blue-600 hover:underline">Vendor Guide</a></li>
              <li><a href="/docs/api-reference" className="text-blue-600 hover:underline">API Reference</a></li>
              <li><a href="/contact" className="text-blue-600 hover:underline">Contact Form</a></li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
