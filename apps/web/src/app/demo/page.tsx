import type { Metadata } from 'next';
import DemoClient from './DemoClient';

export const metadata: Metadata = {
  title: 'Démo live — track.ma',
  description: 'Voyez track.ma en action : 5 véhicules en direct sur Casablanca. Aucune inscription requise.',
  openGraph: {
    title: 'Démo live — Suivi GPS en temps réel | track.ma',
    description: 'Voyez track.ma en action : 5 véhicules en direct sur Casablanca. Aucune inscription requise.',
    url: 'https://trackma.ma/demo',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Démo live — Suivi GPS en temps réel | track.ma',
    images: ['/og-image.png'],
  },
};

export default function DemoPage() {
  return <DemoClient />;
}
