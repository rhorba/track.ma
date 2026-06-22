import type { Metadata } from 'next';
import DemoClient from './DemoClient';

export const metadata: Metadata = {
  title: 'Démo live — track.ma',
  description: 'Voyez track.ma en action : 5 véhicules en direct sur Casablanca.',
};

export default function DemoPage() {
  return <DemoClient />;
}
