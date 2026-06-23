'use client';

import { useState } from 'react';
import { updateBranding } from '@/lib/api';
import { useBranding } from '@/lib/branding';
import { useLocale } from '@/lib/i18n';
import Sidebar from '@/components/Sidebar';

export default function BrandingSettingsPage() {
  const { branding, refresh } = useBranding();
  const { t } = useLocale();

  const [logoUrl, setLogoUrl] = useState(branding?.logoUrl ?? '');
  const [primaryColor, setPrimaryColor] = useState(branding?.primaryColor ?? '#2563eb');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = async () => {
    setStatus('saving');
    try {
      await updateBranding({
        logoUrl: logoUrl || undefined,
        primaryColor,
      });
      await refresh();
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t('branding_title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
          Personnalisez l&apos;apparence de votre espace de travail.
        </p>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t('branding_logo_url')}
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder={t('branding_logo_placeholder')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {logoUrl && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-slate-500">{t('branding_preview')}</span>
                <img
                  src={logoUrl}
                  alt="logo preview"
                  className="h-10 w-10 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white p-0.5"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>

          {/* Primary color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t('branding_color')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-16 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => {
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                    setPrimaryColor(e.target.value);
                  }
                }}
                className="w-28 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* Color preview swatch */}
              <div
                className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleSave}
              disabled={status === 'saving'}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
              {status === 'saving' ? t('branding_saving') : t('branding_save')}
            </button>
            {status === 'saved' && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ {t('branding_saved')}
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
