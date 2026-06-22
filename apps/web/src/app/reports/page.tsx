'use client';

import useSWR from 'swr';
import { getFleetSummary, getTripReport } from '@/lib/api';

function StatCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
        {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ReportsPage() {
  const { data: summary } = useSWR('reports-summary', () => getFleetSummary(), {
    revalidateOnFocus: false,
  });
  const { data: trips = [], isLoading } = useSWR('reports-trips', () => getTripReport(), {
    revalidateOnFocus: false,
  });

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-auto">
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Rapports</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">30 derniers jours — performance de la flotte</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Trajets" value={Number(summary?.totalTrips ?? 0)} />
          <StatCard label="Distance" value={Number(summary?.totalKm ?? 0)} unit="km" />
          <StatCard label="Vitesse moy." value={Number(summary?.avgSpeed ?? 0)} unit="km/h" />
          <StatCard label="Carburant" value={Number(summary?.totalFuel ?? 0)} unit="L" />
        </div>

        {/* Trip list */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Historique des trajets</h2>
          </div>

          {isLoading ? (
            <p className="px-5 py-6 text-sm text-slate-500">Chargement…</p>
          ) : trips.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400 text-center">Aucun trajet enregistré</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-medium">Véhicule</th>
                  <th className="px-4 py-3 text-left font-medium">Départ</th>
                  <th className="px-4 py-3 text-left font-medium">Durée</th>
                  <th className="px-4 py-3 text-left font-medium">Distance</th>
                  <th className="px-4 py-3 text-left font-medium">Vit. max</th>
                  <th className="px-4 py-3 text-left font-medium">Vit. moy.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trips.map((trip: any) => (
                  <tr key={trip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {trip.vehicle?.name ?? trip.vehicleId?.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(trip.startedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDuration(trip.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {Number(trip.distanceKm).toFixed(1)} km
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {Number(trip.maxSpeedKmh).toFixed(0)} km/h
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {Number(trip.avgSpeedKmh).toFixed(0)} km/h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
