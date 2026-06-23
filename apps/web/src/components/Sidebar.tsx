'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n';

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const [mounted, setMounted] = useState(false);

  // useLayoutEffect-free mount detection via useState initializer
  // We use a ref-based approach: render null for theme-dependent content until hydrated
  if (typeof window !== 'undefined' && !mounted) setMounted(true);

  const NAV = [
    { href: '/dashboard', label: t('nav_dashboard'), icon: '◈', adminOnly: false },
    { href: '/vehicles', label: t('nav_vehicles'), icon: '⊡', adminOnly: false },
    { href: '/alerts', label: t('nav_alerts'), icon: '◎', adminOnly: false },
    { href: '/reports', label: t('nav_reports'), icon: '▤', adminOnly: false },
    { href: '/billing', label: t('nav_billing'), icon: '◷', adminOnly: false },
    { href: '/admin', label: t('nav_admin'), icon: '⚙', adminOnly: true },
  ];

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 dark:bg-slate-950 border-e border-slate-700 dark:border-slate-800 text-white shrink-0">
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

      {/* Footer controls */}
      <div className="px-4 py-4 border-t border-slate-700 dark:border-slate-800 space-y-2">
        {/* Lang switcher */}
        <button
          onClick={() => setLocale(locale === 'fr' ? 'ar' : 'fr')}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <span>🌐 {t('lang_switch')}</span>
          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full uppercase">
            {locale === 'fr' ? 'AR' : 'FR'}
          </span>
        </button>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span>{theme === 'dark' ? t('theme_light') : t('theme_dark')}</span>
            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full">
              {theme === 'dark' ? t('theme_light_label') : t('theme_dark_label')}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
