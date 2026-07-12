import { CONTACT } from '@/lib/contact';

export const metadata = {
  title: 'Support — Admin Dashboard — SmartMart Ghana',
  description: 'Admin support dashboard for managing customer and vendor inquiries.',
};

export default function AdminSupportPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Support Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage customer and vendor support inquiries</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Support Phone</h3>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              <a href={`tel:${CONTACT.phoneRaw}`} className="hover:text-blue-600">
                {CONTACT.phone}
              </a>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Support Email</h3>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              <a href={`mailto:${CONTACT.email}`} className="hover:text-blue-600">
                {CONTACT.email}
              </a>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Location</h3>
            <p className="text-lg font-semibold text-gray-900 mt-2">{CONTACT.address}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Support Contact Information</h2>
          <p className="text-gray-600 mb-4">
            This contact information is displayed to customers and vendors across the platform.
            Update it in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">lib/contact.ts</code>.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Phone</dt>
                <dd className="text-gray-900 mt-1">
                  <a href={`tel:${CONTACT.phoneRaw}`} className="text-blue-600 hover:underline">
                    {CONTACT.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Email</dt>
                <dd className="text-gray-900 mt-1">
                  <a href={`mailto:${CONTACT.email}`} className="text-blue-600 hover:underline">
                    {CONTACT.email}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
}
