import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import SwRegistration from '@/components/SwRegistration';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trackma.ma';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'track.ma — Suivi GPS de flotte en temps réel',
    template: '%s | track.ma',
  },
  description:
    'Gérez et suivez votre flotte de véhicules en temps réel. Alertes intelligentes, rapports détaillés et géofencing pour les entreprises marocaines.',
  keywords: ['suivi GPS', 'gestion flotte', 'Maroc', 'track.ma', 'véhicules', 'fleet management'],
  authors: [{ name: 'track.ma', url: SITE_URL }],
  creator: 'track.ma',
  publisher: 'track.ma',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'track.ma' },
  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    url: SITE_URL,
    siteName: 'track.ma',
    title: 'track.ma — Suivi GPS de flotte en temps réel',
    description:
      'Gérez et suivez votre flotte de véhicules en temps réel. Alertes intelligentes, rapports détaillés et géofencing pour les entreprises marocaines.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'track.ma — Tableau de bord de gestion de flotte GPS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'track.ma — Suivi GPS de flotte en temps réel',
    description: 'Gérez et suivez votre flotte de véhicules en temps réel.',
    images: ['/og-image.png'],
    creator: '@trackma_ma',
  },
  alternates: {
    canonical: SITE_URL,
    languages: { 'fr-MA': `${SITE_URL}/fr`, 'ar-MA': `${SITE_URL}/ar` },
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr" className={geist.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
        <Providers>
          <SwRegistration />
          {children}
        </Providers>
      </body>
    </html>
  );
}
