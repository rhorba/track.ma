'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getMyOrg } from './api';

interface Branding {
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
}

interface BrandingContextValue {
  branding: Branding | null;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue>({
  branding: null,
  refresh: async () => {},
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding | null>(null);

  const load = async () => {
    try {
      const org = await getMyOrg();
      setBranding({
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl ?? null,
        primaryColor: org.primaryColor ?? '#2563eb',
      });
    } catch {
      // unauthenticated — no branding available
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Inject CSS custom property whenever primaryColor changes
  useEffect(() => {
    if (branding?.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', branding.primaryColor);
    }
  }, [branding?.primaryColor]);

  return (
    <BrandingContext.Provider value={{ branding, refresh: load }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
