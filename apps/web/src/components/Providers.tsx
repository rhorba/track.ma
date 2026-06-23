'use client';

import { ThemeProvider } from 'next-themes';
import { LocaleProvider } from '@/lib/i18n';
import LocaleEffect from './LocaleEffect';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <LocaleEffect />
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    </LocaleProvider>
  );
}
