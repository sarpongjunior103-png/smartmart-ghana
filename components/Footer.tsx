import { CONTACT } from '@/lib/contact';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold text-lg mb-3">SmartMart Ghana</h3>
            <p className="text-sm text-gray-400">Your trusted multi-vendor marketplace for quality products across Ghana and Africa.</p>
          </div>
          <div>
            <h4 className="text-white font-medium text-sm mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium text-sm mb-3">Customer Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={`tel:${CONTACT.phoneRaw}`} className="hover:text-white transition-colors">
                  {CONTACT.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="hover:text-white transition-colors">
                  {CONTACT.email}
                </a>
              </li>
              <li>Accra, Ghana</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium text-sm mb-3">Follow Us</h4>
            <ul className="space-y-2 text-sm">
              <li><a href={CONTACT.social.facebook} className="hover:text-white transition-colors">Facebook</a></li>
              <li><a href={CONTACT.social.twitter} className="hover:text-white transition-colors">Twitter</a></li>
              <li><a href={CONTACT.social.instagram} className="hover:text-white transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} SmartMart Ghana. All rights reserved.</p>
          <p className="mt-1">
            Contact us: <a href={`tel:${CONTACT.phoneRaw}`} className="hover:text-gray-300">{CONTACT.phone}</a>
            {' | '}
            <a href={`mailto:${CONTACT.email}`} className="hover:text-gray-300">{CONTACT.email}</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
