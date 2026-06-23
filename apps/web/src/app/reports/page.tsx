'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getFleetSummary, getTripReport, getVehicleStats } from '@/lib/api';
import { useLocale, type TranslationKey } from '@/lib/i18n';

type Range = '7d' | '30d' | '90d';

function rangeParams(range: Range) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const to = new Date();
  const from = new Date(Date.now() - days * 86400_000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {typeof value === 'number'
          ? value.toLocaleString(undefined, { maximumFractionDigits: 1 })
          : value}
        {unit && (
          <span className="text-sm font-normal text-slate-400 ms-1">{unit}</span>
        )}
      </p>
    </div>
  );
}

function BarChart({
  data,
  color,
  noDataLabel,
}: {
  data: { label: string; value: number }[];
  color: string;
  noDataLabel: string;
}) {
  if (!data.length) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">{noDataLabel}</p>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const BAR_W = 36;
  const GAP = 10;
  const H = 96;
  const W = data.length * (BAR_W + GAP) - GAP;

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 34}`}
      className="w-full"
      style={{ maxHeight: 160 }}
      aria-hidden="true"
    >
      {data.map((d, i) => {
        const barH = Math.max((d.value / max) * H, 2);
        const x = i * (BAR_W + GAP);
        const truncLabel =
          d.label.length > 8 ? `${d.label.slice(0, 7)}…` : d.label;
        return (
          <g key={i}>
            <rect
              x={x}
              y={H - barH}
              width={BAR_W}
              height={barH}
              rx={3}
              fill={color}
              fillOpacity={0.85}
            />
            <text
              x={x + BAR_W / 2}
              y={H + 14}
              textAnchor="middle"
              fontSize="9"
              fill="#94a3b8"
            >
              {truncLabel}
            </text>
            <text
              x={x + BAR_W / 2}
              y={H - barH - 4}
              textAnchor="middle"
              fontSize="9"
              fill="#64748b"
            >
              {Number(d.value).toFixed(0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ChartCard({
  title,
  unit,
  children,
}: {
  title: string;
  unit: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {title}
        </h3>
        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {unit}
        </span>
      </div>
      {children}
    </div>
  );
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const RANGE_LABELS: Record<Range, TranslationKey> = {
  '7d': 'reports_range_7d',
  '30d': 'reports_range_30d',
  '90d': 'reports_range_90d',
};

export default function ReportsPage() {
  const { t } = useLocale();
  const [range, setRange] = useState<Range>('30d');
  const { from, to } = rangeParams(range);

  const { data: summary } = useSWR(
    ['reports-summary', range],
    () => getFleetSummary(from, to),
    { revalidateOnFocus: false },
  );

  const { data: trips = [], isLoading: tripsLoading } = useSWR(
    ['reports-trips', range],
    () => getTripReport(undefined, from, to),
    { revalidateOnFocus: false },
  );

  const { data: vehicleStats = [] } = useSWR(
    ['reports-by-vehicle', range],
    () => getVehicleStats(from, to),
    { revalidateOnFocus: false },
  );

  const distanceData = (vehicleStats as any[]).map((v) => ({
    label: v.vehicleName ?? (v.vehicleId as string).slice(0, 8),
    value: Number(v.totalKm),
  }));
  const speedData = (vehicleStats as any[]).map((v) => ({
    label: v.vehicleName ?? (v.vehicleId as string).slice(0, 8),
    value: Number(v.avgSpeed),
  }));
  const fuelData = (vehicleStats as any[]).map((v) => ({
    label: v.vehicleName ?? (v.vehicleId as string).slice(0, 8),
    value: Number(v.totalFuel),
  }));

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('reports_title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('reports_subtitle')}
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
          {(['7d', '30d', '90d'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t(RANGE_LABELS[r])}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label={t('reports_stat_trips')}
            value={Number(summary?.totalTrips ?? 0)}
          />
          <StatCard
            label={t('reports_stat_distance')}
            value={Number(summary?.totalKm ?? 0)}
            unit="km"
          />
          <StatCard
            label={t('reports_stat_speed')}
            value={Number(summary?.avgSpeed ?? 0)}
            unit="km/h"
          />
          <StatCard
            label={t('reports_stat_fuel')}
            value={Number(summary?.totalFuel ?? 0)}
            unit="L"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ChartCard title={t('reports_chart_distance')} unit="km">
            <BarChart
              data={distanceData}
              color="#2563eb"
              noDataLabel={t('reports_no_data')}
            />
          </ChartCard>
          <ChartCard title={t('reports_chart_speed')} unit="km/h">
            <BarChart
              data={speedData}
              color="#16a34a"
              noDataLabel={t('reports_no_data')}
            />
          </ChartCard>
          <ChartCard title={t('reports_chart_fuel')} unit="L">
            <BarChart
              data={fuelData}
              color="#d97706"
              noDataLabel={t('reports_no_data')}
            />
          </ChartCard>
        </div>

        {/* Trip history table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('reports_trips_title')}
            </h2>
          </div>

          {tripsLoading ? (
            <p className="px-5 py-6 text-sm text-slate-500">{t('loading')}</p>
          ) : (trips as any[]).length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400 text-center">
              {t('reports_no_trips')}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3 text-start font-medium">
                    {t('reports_col_vehicle')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {t('reports_col_departure')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {t('reports_col_duration')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {t('reports_col_distance')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {t('reports_col_max_speed')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {t('reports_col_avg_speed')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(trips as any[]).map((trip) => (
                  <tr
                    key={trip.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {trip.vehicle?.name ?? (trip.vehicleId as string).slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(trip.startedAt as string).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDuration(trip.durationSeconds as number)}
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
