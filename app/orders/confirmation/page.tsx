import { CONTACT } from '@/lib/contact';

export const metadata = {
  title: 'Order Confirmation — SmartMart Ghana',
  description: 'Your order has been confirmed. Thank you for shopping with SmartMart Ghana.',
};

export default function OrderConfirmationPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. We&apos;ve sent a confirmation email with your order details.
            You will receive updates as your order is processed and shipped.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 text-left border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-gray-600 mb-2">
              If you have any questions about your order, our customer support team is here to help:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">Phone: </span>
                <a href={`tel:${CONTACT.phoneRaw}`} className="text-blue-600 hover:underline">
                  {CONTACT.phone}
                </a>
              </li>
              <li>
                <span className="font-medium text-gray-900">Email: </span>
                <a href={`mailto:${CONTACT.email}`} className="text-blue-600 hover:underline">
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/"
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </a>
            <a
              href="/dashboard"
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Track Order
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
