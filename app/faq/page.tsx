import { CONTACT } from '@/lib/contact';

export const metadata = {
  title: 'FAQ — SmartMart Ghana',
  description: 'Frequently asked questions about shopping, orders, payments, and selling on SmartMart Ghana.',
};

const faqs = [
  {
    q: 'How do I create an account on SmartMart Ghana?',
    a: 'Click the "Register" button at the top of any page and fill in your details. You\'ll receive a welcome email once your account is created.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept mobile money (MTN MoMo, Vodafone Cash, AirtelTigo Money), bank cards (Visa and Mastercard), and bank transfers through Paystack, Flutterwave, Hubtel, and Stripe.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Delivery within Accra typically takes 1-2 business days. Other regions may take 3-5 business days. You\'ll receive a tracking number once your order ships.',
  },
  {
    q: 'What is the return policy?',
    a: 'Returns are accepted within 7 days of delivery for eligible items. The product must be in its original condition. Refunds are processed to the original payment method within 5-10 business days.',
  },
  {
    q: 'How do I become a vendor on SmartMart Ghana?',
    a: 'Click "Register" and select "Vendor" as your account type. After submitting your business details, our team will review your application. Approved vendors can start listing products immediately.',
  },
  {
    q: 'How do I track my order?',
    a: 'Go to "My Orders" in your account dashboard to see real-time order status and tracking information. You\'ll also receive email and SMS updates at each stage.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. All payments are processed through certified payment gateways (Paystack, Flutterwave, Hubtel, Stripe). We never store your card or payment details on our servers.',
  },
  {
    q: 'How do I contact customer support?',
    a: `You can reach us by phone at ${CONTACT.phone} or by email at ${CONTACT.email}. Our support team is available Monday to Friday, 8:00 AM to 6:00 PM GMT.`,
  },
  {
    q: 'Do you offer loyalty rewards?',
    a: 'Yes! Every purchase earns loyalty points that can be redeemed for discounts. You can also earn bonus points through referrals and seasonal promotions.',
  },
  {
    q: 'Can I sell products as an individual, or do I need a registered business?',
    a: 'Both individuals and registered businesses can become vendors. However, having a registered business may qualify you for additional features and lower commission rates.',
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-600 mb-10 text-lg">Find answers to common questions about SmartMart Ghana.</p>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h2 className="text-lg font-semibold text-gray-900 pr-4">{faq.q}</h2>
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-xl border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Still have questions?</h2>
          <p className="text-gray-600 mb-6">Our support team is here to help you.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`tel:${CONTACT.phoneRaw}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Us: {CONTACT.phone}
            </a>
            <a
              href={`mailto:${CONTACT.email}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Us: {CONTACT.email}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
