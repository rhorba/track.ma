'use client';

import useSWR, { mutate } from 'swr';
import { getAlerts, acknowledgeAlert } from '@/lib/api';

const TYPE_LABELS: Record<string, string> = {
  speeding: 'Excès de vitesse',
  geofence_enter: 'Entrée en zone',
  geofence_exit: 'Sortie de zone',
  ignition_on: 'Allumage',
  ignition_off: 'Extinction',
  low_fuel: 'Carburant bas',
  offline: 'Hors ligne',
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border border-red-500/30',
  warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  info: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
};

export default function AlertsPage() {
  const { data: alerts = [], isLoading } = useSWR('alerts', getAlerts, { refreshInterval: 15000 });

  async function handleAck(id: string) {
    await acknowledgeAlert(id);
    mutate('alerts');
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Historique des alertes</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Les 100 dernières alertes de votre flotte</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p className="text-sm">Aucune alerte pour l&apos;instant</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Gravité</th>
                  <th className="px-4 py-3 text-left font-medium">Véhicule</th>
                  <th className="px-4 py-3 text-left font-medium">Message</th>
                  <th className="px-4 py-3 text-left font-medium">Heure</th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {alerts.map((alert: any) => (
                  <tr
                    key={alert.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      alert.acknowledged ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {TYPE_LABELS[alert.type] ?? alert.type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_BADGE[alert.severity] ?? ''}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {alert.vehicle?.name ?? alert.vehicleId?.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {alert.message}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                      {new Date(alert.triggeredAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {alert.acknowledged ? (
                        <span className="text-xs text-slate-400">Traité</span>
                      ) : (
                        <button
                          onClick={() => handleAck(alert.id)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Traiter
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
