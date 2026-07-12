import { CONTACT } from '@/lib/contact';

export const metadata = {
  title: 'Contact Us — SmartMart Ghana',
  description: 'Contact SmartMart Ghana for customer support, vendor inquiries, or general questions.',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h1>
        <p className="text-gray-600 mb-8 text-lg">
          We&apos;re here to help. Reach out to us through any of the channels below.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Support</h2>
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

          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Vendor Support</h2>
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
              <p>For vendor onboarding, payouts, and store management</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 rounded-xl p-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Head Office</h2>
          <div className="space-y-3 text-gray-600">
            <p>{CONTACT.address}</p>
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
          </div>
        </div>
      </div>
    </main>
  );
}
