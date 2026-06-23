'use client';

import { useEffect } from 'react';
import { useLocale } from '@/lib/i18n';

export default function LocaleEffect() {
  const { locale } = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);
  return null;
}
