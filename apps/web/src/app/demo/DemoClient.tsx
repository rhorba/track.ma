'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDemoSocket } from '@/lib/socket';
import type { LivePosition } from '@/lib/socket';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const VEHICLE_NAMES: Record<string, string> = {
  'demo-1': 'Camion Casa 1',
  'demo-2': 'Camion Casa 2',
  'demo-3': 'Fourgon Nord',
  'demo-4': 'Véhicule Port',
  'demo-5': 'Livreur Sud',
};

export default function DemoClient() {
  const [seed, setSeed] = useState<Record<string, LivePosition>>({});
  const live = useDemoSocket();

  useEffect(() => {
    fetch(`${API_URL}/api/fleet/demo/positions`)
      .then((r) => r.json())
      .then((positions: LivePosition[]) => {
        const map: Record<string, LivePosition> = {};
        for (const p of positions) map[p.vehicleId] = p;
        setSeed(map);
      })
      .catch(() => {});
  }, []);

  const positions = Object.keys(live).length > 0 ? live : seed;
  const vehicles = Object.values(positions);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center justify-between flex-shrink-0">
        <Link href="/" className="text-emerald-400 font-bold text-lg">track.ma</Link>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Démo live — Casablanca
        </div>
        <Link
          href="/register"
          className="text-sm bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Démarrer gratuitement
        </Link>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Véhicules de démo</p>
            <p className="text-xs text-slate-600">Mise à jour toutes les 10 secondes</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            {vehicles.length === 0
              ? Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="h-3 bg-slate-800 rounded w-3/4 mb-2" />
                    <div className="h-2 bg-slate-800 rounded w-1/2" />
                  </div>
                ))
              : vehicles.map((v) => (
                  <div key={v.vehicleId} className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${v.ignition ? 'bg-emerald-400' : 'bg-slate-600'}`}
                      />
                      <span className="text-sm font-medium text-white truncate">
                        {VEHICLE_NAMES[v.vehicleId] ?? v.vehicleId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 pl-4">
                      {v.speed} km/h · {v.lat.toFixed(4)}, {v.lng.toFixed(4)}
                    </p>
                  </div>
                ))}
          </div>

          {/* CTA in sidebar */}
          <div className="p-4 border-t border-slate-800">
            <p className="text-xs text-slate-400 mb-3">
              Prêt à suivre votre propre flotte ?
            </p>
            <Link
              href="/register"
              className="block text-center bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Essayer gratuitement
            </Link>
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <Map positions={positions} />

          {/* Overlay banner */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="bg-slate-900/95 backdrop-blur border border-slate-700 rounded-2xl px-6 py-4 flex items-center gap-6 shadow-2xl">
              <div>
                <p className="text-white font-semibold text-sm">Vous regardez la démo live</p>
                <p className="text-slate-400 text-xs">Créez votre compte pour gérer votre propre flotte</p>
              </div>
              <Link
                href="/register"
                className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                Commencer — Gratuit
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
