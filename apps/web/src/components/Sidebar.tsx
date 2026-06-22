'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈', adminOnly: false },
  { href: '/vehicles', label: 'Vehicles', icon: '⊡', adminOnly: false },
  { href: '/alerts', label: 'Alerts', icon: '◎', adminOnly: false },
  { href: '/reports', label: 'Reports', icon: '▤', adminOnly: false },
  { href: '/billing', label: 'Billing', icon: '◷', adminOnly: false },
  { href: '/admin', label: 'Admin', icon: '⚙', adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 dark:bg-slate-950 border-r border-slate-700 dark:border-slate-800 text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
          T
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">track.ma</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.filter(({ adminOnly }) => !adminOnly || user?.role === 'org_admin').map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="px-4 py-4 border-t border-slate-700 dark:border-slate-800">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span>{theme === 'dark' ? '☀ Light mode' : '☾ Dark mode'}</span>
            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
