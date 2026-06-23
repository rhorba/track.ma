'use client';

import dynamic from 'next/dynamic';
import { useFleetSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth';
import useSWR from 'swr';
import { getFleetPositions, getGeofences } from '@/lib/api';
import AlertBell from '@/components/AlertBell';
import { useLocale } from '@/lib/i18n';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

function StatusBadge({ active, idle, offline }: { active: number; idle: number; offline: number }) {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        <span className="text-slate-600 dark:text-slate-400">{active} {t('status_active')}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
        <span className="text-slate-600 dark:text-slate-400">{idle} {t('status_idle')}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
        <span className="text-slate-600 dark:text-slate-400">{offline} {t('status_offline')}</span>
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const livePositions = useFleetSocket(user?.organizationId ?? null);

  const { data: initial } = useSWR('fleet-positions', getFleetPositions, {
    revalidateOnFocus: false,
  });
  const { data: geofences } = useSWR('geofences', getGeofences, { revalidateOnFocus: false });

  const seedPositions: Record<string, any> = {};
  if (initial) {
    for (const item of initial) {
      if (item.position) seedPositions[item.vehicle.id] = item.position;
    }
  }
  const positions = { ...seedPositions, ...livePositions };

  const values = Object.values(positions) as any[];
  const active = values.filter((p) => p.ignition && p.speed > 0).length;
  const idle = values.filter((p) => p.ignition && p.speed === 0).length;
  const offline = values.filter((p) => !p.ignition).length;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard_title')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('dashboard_subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge active={active} idle={idle} offline={offline} />
          <AlertBell orgId={user?.organizationId ?? null} />
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <Map positions={positions} geofences={geofences ?? []} />

        {/* Vehicle count chip */}
        <div className="absolute bottom-4 end-4 z-[1000] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 shadow-lg text-sm font-medium text-slate-700 dark:text-slate-300">
          {values.length} {values.length !== 1 ? t('vehicles_tracked_many') : t('vehicles_tracked_one')}
        </div>
      </div>
    </div>
  );
}
