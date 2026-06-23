import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trackma.ma';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/register', '/demo', '/login'],
        disallow: [
          '/dashboard',
          '/vehicles',
          '/alerts',
          '/reports',
          '/billing',
          '/admin',
          '/settings',
          '/api/',
          '/offline',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
