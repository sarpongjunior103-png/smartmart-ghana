import './globals.css';
import { Footer } from '@/components/shared/footer';
import { Navbar } from '@/components/shared/navbar';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { LocaleProvider } from '@/lib/locale-context';
import { AIAssistant } from '@/components/shared/ai-assistant';

export const metadata = {
  title: 'SmartMart Ghana — Multi-Vendor Marketplace',
  description: 'A modern multi-vendor e-commerce marketplace for Ghana and Africa.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LocaleProvider>
            <CartProvider>
              <Navbar />
              <main>{children}</main>
              <Footer />
              <AIAssistant />
            </CartProvider>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
