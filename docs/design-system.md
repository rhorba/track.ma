# Design System — TrackMa

**Author**: UI Designer  
**Date**: 2026-06-22  
**Stack**: Tailwind CSS v4 + CSS custom properties

---

## Brand Identity

**Product**: TrackMa  
**Tagline**: "Suivez votre flotte. Partout. Simplement."  
**Personality**: Professional, trustworthy, modern, accessible, Moroccan-rooted

---

## Color System

### Primary Palette

```css
:root {
  /* Brand */
  --color-brand-primary: #1A6B4A;    /* Deep green — trust, Morocco */
  --color-brand-secondary: #E8A020;  /* Amber — energy, alert, warmth */
  --color-brand-accent: #2563EB;     /* Blue — technology, link */

  /* Semantic */
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-error: #DC2626;
  --color-info: #2563EB;

  /* Vehicle status */
  --color-status-active: #22C55E;    /* Green — moving */
  --color-status-idle: #F59E0B;      /* Amber — ignition on, not moving */
  --color-status-offline: #6B7280;   /* Grey — no signal */
  --color-status-alert: #EF4444;     /* Red — alert state */
}
```

### Neutrals

```css
:root {
  --color-gray-50:  #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;
}
```

### Tailwind Config

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1A6B4A',
          secondary: '#E8A020',
          accent: '#2563EB',
        },
        status: {
          active: '#22C55E',
          idle: '#F59E0B',
          offline: '#6B7280',
          alert: '#EF4444',
        },
      },
    },
  },
}
```

---

## Typography

### Font Stack

```css
:root {
  /* Primary: Inter for Latin (FR), system fallback */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;

  /* Arabic: Noto Sans Arabic for AR mode */
  --font-arabic: 'Noto Sans Arabic', 'Segoe UI', sans-serif;
}
```

### Scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| `text-xs` | 12px | 400 | Labels, timestamps, captions |
| `text-sm` | 14px | 400/500 | Body, table rows, form labels |
| `text-base` | 16px | 400 | Default body text |
| `text-lg` | 18px | 500/600 | Card titles, section headings |
| `text-xl` | 20px | 600 | Page headings |
| `text-2xl` | 24px | 700 | Dashboard KPI numbers |
| `text-3xl` | 30px | 700 | Landing page section titles |
| `text-4xl` | 36px | 800 | Hero headline |

---

## Spacing & Layout

- Base unit: 4px
- Container max-width: 1280px
- Sidebar width: 260px
- Map panel: fluid (fills remaining width)
- KPI sidebar: 320px

```
Mobile breakpoint:  640px (sm)
Tablet breakpoint:  768px (md)
Desktop breakpoint: 1024px (lg)
Wide breakpoint:    1280px (xl)
```

---

## Component Inventory

### Core UI Components

| Component | Description | Variants |
|---|---|---|
| `Button` | Action trigger | primary / secondary / ghost / danger / icon-only |
| `Input` | Form text input | default / error / disabled |
| `Badge` | Status label | active (green) / idle (amber) / offline (grey) / alert (red) |
| `Card` | Content container | default / elevated / clickable |
| `KPICard` | Dashboard metric widget | number + label + optional trend |
| `Modal` | Overlay dialog | default / confirmation |
| `Toast` | Notification popup | success / error / warning / info |
| `Dropdown` | Select menu | single / multi |
| `Table` | Data grid | sortable columns, row actions |
| `Skeleton` | Loading placeholder | text / block / circle |

### Fleet-Specific Components

| Component | Description |
|---|---|
| `VehicleMarker` | Leaflet marker with status color ring, rotation for heading |
| `VehicleStatusBadge` | Pill badge: active / idle / offline |
| `AlertCard` | Alert item with type icon, severity, acknowledge button |
| `TripRow` | Trip list item with distance, duration, replay button |
| `MapPanel` | Leaflet wrapper with controls, fullscreen, search |
| `GeofenceLayer` | Leaflet polygon overlay for geofences |
| `FuelBar` | Horizontal progress bar for fuel level |
| `SpeedGauge` | Small gauge component for speed display |

---

## Icons

Use Heroicons (already included with Tailwind CSS).

| Usage | Icon |
|---|---|
| Dashboard | `Squares2X2Icon` |
| Vehicles | `TruckIcon` |
| Alerts | `BellIcon` / `BellAlertIcon` |
| Trips | `MapIcon` |
| Geofences | `MapPinIcon` |
| Reports | `ChartBarIcon` |
| Settings | `Cog6ToothIcon` |
| Fuel | `BeakerIcon` |
| Speed alert | `BoltIcon` |
| Ignition on | `PlayCircleIcon` |
| Ignition off | `StopCircleIcon` |
| Add | `PlusIcon` |
| Edit | `PencilSquareIcon` |
| Delete | `TrashIcon` |
| Download | `ArrowDownTrayIcon` |
| User | `UserCircleIcon` |

---

## RTL Support (Arabic Mode)

When `lang="ar"` is set on `<html>`:

```css
[dir="rtl"] {
  /* Flip flex directions */
  .flex-row { flex-direction: row-reverse; }

  /* Flip margins/paddings */
  .ml-2 { margin-left: 0; margin-right: 0.5rem; }
  .pl-4 { padding-left: 0; padding-right: 1rem; }

  /* Sidebar moves to right */
  .sidebar { left: auto; right: 0; }

  /* Text alignment */
  .text-left { text-align: right; }
}
```

Tailwind handles most RTL via `rtl:` variant:
```html
<div class="ml-4 rtl:ml-0 rtl:mr-4">...</div>
```

---

## Dark Mode

Design system supports dark mode via `dark:` Tailwind variants.

```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

Map in dark mode: Use CartoDB Dark Matter tile layer:
```
https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png
```

---

## Component Usage Examples

### KPI Card

```tsx
<KPICard
  label="Véhicules actifs"
  value={12}
  trend={+2}
  trendLabel="vs hier"
  icon={<TruckIcon />}
  color="green"
/>
```

### Vehicle Status Badge

```tsx
<VehicleStatusBadge status="active" />   // 🟢 Actif
<VehicleStatusBadge status="idle" />     // 🟡 Inactif
<VehicleStatusBadge status="offline" />  // ⚫ Hors ligne
```

### Alert Toast

```tsx
toast.warning({
  title: "Excès de vitesse",
  message: "Camion 01 — 145 km/h sur A5",
  vehicleId: "abc123",
  action: { label: "Voir", href: "/alerts" }
})
```
