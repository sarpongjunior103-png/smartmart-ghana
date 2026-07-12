import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/seller/dashboard', '/dashboard', '/cart', '/checkout', '/orders'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/seller/dashboard', '/dashboard', '/cart', '/checkout', '/orders'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://smartmartghana.com'}/sitemap.xml`,
  };
}
