import { CONTACT } from '@/lib/contact';
import { MetadataRoute } from 'next';

export const metadata = {
  title: 'About Us — SmartMart Ghana',
  description: 'Learn about SmartMart Ghana, the leading multi-vendor marketplace connecting buyers and sellers across Ghana and Africa.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">About SmartMart Ghana</h1>
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
          <p>
            SmartMart Ghana is a leading multi-vendor e-commerce marketplace that connects buyers and sellers
            across Ghana and the broader African continent. Our mission is to make online shopping accessible,
            secure, and convenient for everyone.
          </p>
          <p>
            Founded with the vision of empowering local businesses, SmartMart Ghana provides a platform where
            vendors can showcase their products to a wide audience, and customers can find quality items at
            competitive prices. We support multiple payment methods including mobile money, cards, and bank
            transfers through partnerships with Paystack, Flutterwave, Hubtel, and Stripe.
          </p>
          <p>
            Our platform is built with cutting-edge technology to ensure a seamless shopping experience,
            with features like advanced search, real-time order tracking, multi-language support, and a
            rewards program for loyal customers.
          </p>
        </div>

        <div className="mt-12 bg-gray-50 rounded-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
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
            <p>
              <span className="font-medium text-gray-900">Address: </span>
              {CONTACT.address}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
