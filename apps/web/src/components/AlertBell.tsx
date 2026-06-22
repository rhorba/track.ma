'use client';

import { useState } from 'react';
import { useAlertSocket, LiveAlert } from '@/lib/socket';
import { acknowledgeAlert } from '@/lib/api';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/10 border-red-500/30 text-red-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
};

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  warning: 'bg-yellow-400',
  info: 'bg-blue-400',
};

export default function AlertBell({ orgId }: { orgId: string | null }) {
  const { alerts, dismiss } = useAlertSocket(orgId);
  const [open, setOpen] = useState(false);

  const unread = alerts.filter((a) => !a.acknowledged).length;

  async function handleAcknowledge(alert: LiveAlert) {
    try {
      await acknowledgeAlert(alert.id);
      dismiss(alert.id);
    } catch {
      // silently ignore — optimistic UI already dismissed
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="Alerts"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <span className="text-sm font-semibold text-white">Alerts</span>
              {unread > 0 && (
                <span className="text-xs text-slate-400">{unread} unread</span>
              )}
            </div>

            {alerts.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500 text-center">No alerts</p>
            ) : (
              <ul className="divide-y divide-slate-800">
                {alerts.map((alert) => (
                  <li
                    key={alert.id}
                    className={`px-4 py-3 flex gap-3 items-start ${alert.acknowledged ? 'opacity-50' : ''}`}
                  >
                    <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[alert.severity] ?? 'bg-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium px-1.5 py-0.5 rounded border inline-block mb-1 ${SEVERITY_COLORS[alert.severity] ?? ''}`}>
                        {alert.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-slate-300 leading-snug">{alert.message}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(alert.triggeredAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert)}
                        className="shrink-0 text-[10px] text-slate-400 hover:text-white mt-1"
                      >
                        OK
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
