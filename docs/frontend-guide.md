# Frontend Development Guide — TrackMa

**Author**: Frontend Developer  
**Date**: 2026-06-22  
**Stack**: Next.js 15 App Router, TypeScript, Tailwind CSS v4, NextAuth

---

## File Structure

```
apps/web/src/
├── app/
│   ├── (public)/           — Unauthenticated routes (/, /demo, /login, /register)
│   │   ├── page.tsx        — Landing page
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/        — Authenticated app shell
│   │   ├── layout.tsx      — Sidebar + navbar layout
│   │   ├── dashboard/
│   │   ├── vehicles/
│   │   ├── alerts/
│   │   ├── geofences/
│   │   ├── reports/
│   │   └── settings/
│   ├── layout.tsx          — Root layout (fonts, providers)
│   └── globals.css
├── components/
│   ├── ui/                 — Generic components (Button, Card, Modal, Toast...)
│   ├── fleet/              — Domain components (VehicleMarker, AlertCard, TripRow...)
│   ├── map/                — Leaflet wrapper components
│   └── layout/             — Navbar, Sidebar
├── hooks/
│   ├── useFleetSocket.ts   — Socket.IO live position subscription
│   ├── useVehicles.ts      — SWR data fetching for vehicles
│   └── useAlerts.ts
├── lib/
│   ├── api.ts              — Axios instance with auth header
│   ├── socket.ts           — Socket.IO client singleton
│   └── auth.ts             — NextAuth config
└── types/
    └── index.ts            — Re-exports from @trackma/shared + local types
```

---

## Auth Pattern

All dashboard routes are protected. Never check auth in individual pages — use the layout.

```typescript
// app/(dashboard)/layout.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <AppShell session={session}>{children}</AppShell>;
}
```

### API calls with auth token

```typescript
// lib/api.ts
import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

export default api;
```

---

## Data Fetching

Use SWR for client-side fetching with auto-refresh:

```typescript
// hooks/useVehicles.ts
import useSWR from 'swr';
import api from '@/lib/api';

export function useVehicles() {
  const { data, error, mutate } = useSWR('/api/vehicles', 
    (url) => api.get(url).then(r => r.data)
  );
  return { vehicles: data ?? [], isLoading: !data && !error, mutate };
}
```

For server components, fetch directly:

```typescript
// app/(dashboard)/vehicles/page.tsx
import { getServerSession } from 'next-auth';

export default async function VehiclesPage() {
  const session = await getServerSession(authOptions);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicles`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: 'no-store',
  });
  const vehicles = await res.json();
  return <VehicleList vehicles={vehicles} />;
}
```

---

## Leaflet Map Integration

Leaflet is browser-only — must be wrapped in dynamic import with `ssr: false`:

```typescript
// components/map/FleetMap.tsx
'use client';

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });

export function FleetMap({ vehicles }) {
  return <MapComponent vehicles={vehicles} />;
}
```

```typescript
// components/map/MapComponent.tsx — runs browser-only
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapComponent({ vehicles }) {
  return (
    <MapContainer center={[33.5731, -7.5898]} zoom={12} style={{ height: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© OpenStreetMap contributors'
      />
      {vehicles.map(v => v.position && (
        <VehicleMarker key={v.id} vehicle={v} />
      ))}
    </MapContainer>
  );
}
```

---

## WebSocket Live Updates

```typescript
// hooks/useFleetSocket.ts
'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GpsPosition } from '@trackma/shared';

export function useFleetSocket(orgId: string, onPosition: (pos: GpsPosition) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/fleet`);
    socketRef.current = socket;

    socket.emit('join', { orgId });
    socket.on('position', onPosition);

    return () => { socket.disconnect(); };
  }, [orgId]);
}
```

Usage in a page:

```typescript
const [positions, setPositions] = useState<Record<string, GpsPosition>>({});

useFleetSocket(session.orgId, (pos) => {
  setPositions(prev => ({ ...prev, [pos.vehicleId]: pos }));
});
```

---

## Form Handling

Use react-hook-form + zod:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(100),
  licensePlate: z.string().min(1).max(20),
  type: z.enum(['car', 'truck', 'motorcycle', 'van']),
  imei: z.string().regex(/^\d{15}$/).optional(),
});

export function VehicleForm({ onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input label="Nom du véhicule" {...register('name')} error={errors.name?.message} />
      ...
    </form>
  );
}
```

---

## RTL (Arabic) Support

```typescript
// app/layout.tsx
import { useLocale } from 'next-intl';

export default function RootLayout({ children }) {
  const locale = useLocale();
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>{children}</body>
    </html>
  );
}
```

Use Tailwind's `rtl:` modifier for layout flips:
```html
<div class="ml-4 rtl:ml-0 rtl:mr-4 flex rtl:flex-row-reverse">
```

---

## Component Conventions

- All components in PascalCase files: `VehicleCard.tsx`
- Client components with interactivity: add `'use client'` at top
- No client components at page level unless required — keep pages server components
- Props: always define a TypeScript interface above the component
- No inline styles — use Tailwind only
- Icons: use Heroicons (`@heroicons/react/24/outline`)

---

## Performance

- Map components: always lazy-loaded (no SSR)
- Heavy lists: use virtualization (`react-virtual`) if > 100 items
- Images: use `next/image` with proper width/height
- API data: SWR handles caching and deduplication automatically
- WebSocket: single connection per page, cleaned up on unmount

---

## Accessibility Checklist

Before shipping any page:
- [ ] All interactive elements have keyboard focus styling
- [ ] Form labels are associated with inputs (via `htmlFor` or aria)
- [ ] Icon-only buttons have `aria-label`
- [ ] Color is not the only indicator (use text + color for status badges)
- [ ] Leaflet map has keyboard navigation (built-in)
- [ ] Toast notifications are announced by screen readers (`role="alert"`)
