import './globals.css';
import { Footer } from '@/components/Footer';
import { CONTACT } from '@/lib/contact';

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
        {children}
        <Footer />
      </body>
    </html>
  );
}
