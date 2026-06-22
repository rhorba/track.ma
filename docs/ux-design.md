# UX Design — TrackMa

**Author**: UX Designer  
**Date**: 2026-06-22

---

## User Personas

### Persona 1 — Karim, Fleet Manager

**Profile**: Operations manager at a mid-size logistics company in Casablanca. Manages 15 delivery vans. Uses a laptop at his desk, sometimes checks on mobile.

**Goals**:
- Know where every vehicle is at any moment
- Catch speeding drivers immediately
- Prove deliveries were made (trip history)
- Keep fuel costs down

**Pain points with current solution (MIA Fleet)**:
- Had to wait 3 days for installation and setup
- Can't log in himself — has to call support to add a new vehicle
- No idea what he's paying until the invoice arrives

**What he needs from TrackMa**:
- Dashboard he can set up in < 30 minutes himself
- Instant alerts when a driver speeds
- Clear monthly cost

---

### Persona 2 — Fatima, Business Owner

**Profile**: Runs a small catering business in Marrakech. Has 3 vans. Not very technical but uses WhatsApp and Facebook daily.

**Goals**:
- Know if her vans are moving when they should be
- Get notified if a van is used outside business hours
- Protect against theft

**Pain points**:
- Existing solutions feel complex and expensive
- Doesn't understand GPS terminology

**What she needs from TrackMa**:
- Simple map view that just works
- Plain-language alerts ("Camion 1 a quitté Marrakech")
- Arabic language option

---

### Persona 3 — Amine, Individual Owner

**Profile**: Young professional in Rabat. Recently bought a new car. Worried about theft.

**Goals**:
- Know his car is where he left it
- Be alerted if it moves unexpectedly

**What he needs from TrackMa**:
- Cheap starter plan (just 1 vehicle)
- Simple mobile-friendly interface
- Easy self-service setup

---

## Information Architecture

```
Public Site (unauthenticated)
├── / (Landing page)
│   ├── Hero + CTA
│   ├── Features overview
│   ├── How it works (3 steps)
│   ├── Pricing tiers
│   └── Contact form
├── /register
├── /login
└── /demo (interactive demo map)

App (authenticated)
├── /dashboard (live map + KPI widgets)
├── /vehicles
│   ├── /vehicles (list)
│   ├── /vehicles/new
│   ├── /vehicles/:id (detail + latest position)
│   └── /vehicles/:id/trips
├── /alerts
│   ├── /alerts (history list)
│   └── /alerts/rules
├── /geofences
│   ├── /geofences (list + map)
│   └── /geofences/new
├── /reports
└── /settings
    ├── /settings/team
    ├── /settings/billing
    └── /settings/profile
```

---

## User Flows

### Flow 1 — New User Onboarding

```
Landing page
    ↓ CTA "Essayez gratuitement"
/register (name, email, password, org name)
    ↓ Success
/dashboard (empty state)
    ↓ Onboarding banner: "Add your first vehicle"
/vehicles/new (name, plate, type, IMEI)
    ↓ Saved
/dashboard — marker appears when device sends first ping
    ↓ Success message
Full dashboard activated
```

**Key UX principles**:
- No credit card required to start (trial tier)
- Onboarding in < 5 minutes
- First value (seeing a vehicle on map) as fast as possible

---

### Flow 2 — Alert Triggered

```
Device sends position with speed > threshold
    ↓ Backend creates Alert
WebSocket broadcasts to dashboard
    ↓ Toast notification appears on screen
    ↓ Bell icon in nav shows badge
User clicks bell → /alerts
    ↓ Alert list shows new item highlighted
User clicks "Acknowledge"
    ↓ Alert marked read, removed from unread count
```

---

### Flow 3 — Trip Replay

```
/vehicles → click vehicle → "View trips"
    ↓
Trip list (date, distance, duration)
    ↓ Click trip
Map zooms to trip bounding box
Polyline drawn showing route
    ↓ Click "Replay"
Animated marker moves along polyline
Speed indicator updates during replay
    ↓ "Stop" button to exit replay
```

---

## Key UX Principles

1. **Speed over features** — Dashboard must load < 3 seconds. Map must render before everything else.
2. **Plain language** — No technical jargon in user-facing text. "Véhicule hors ligne depuis 2h" not "Device status: OFFLINE (timeout)"
3. **Mobile-first for map** — Fleet managers often check on phone. Map must be touch-friendly.
4. **Progressive disclosure** — Advanced features (geofences, multi-user, reports) hidden until user needs them. Onboarding shows only map + vehicles.
5. **Bilingual with RTL** — Arabic is RTL. Layout must flip correctly. Test all components in AR mode.

---

## Wireframe Descriptions

### Dashboard (main view)

```
┌─────────────────────────────────────────────────────┐
│ [TrackMa Logo]  [Nav: Dashboard Vehicles Alerts ...]│ ← Navbar
│                                    [🔔 3] [Karim ▾] │
├────────────────────────────────┬────────────────────┤
│                                │ KPI Cards           │
│                                │ ┌──────┐ ┌──────┐  │
│                                │ │  12  │ │  3   │  │
│      LEAFLET MAP               │ │Active│ │Alert │  │
│                                │ └──────┘ └──────┘  │
│   [Vehicle markers on map]     │ ┌──────┐ ┌──────┐  │
│                                │ │ 847  │ │ 98L  │  │
│                                │ │ km   │ │ fuel │  │
│                                │ └──────┘ └──────┘  │
│                                ├────────────────────┤
│                                │ Vehicle List        │
│                                │ 🟢 Camion 01  65km/h│
│                                │ 🟡 Camion 02  idle  │
│                                │ ⚫ Camion 03  offline│
└────────────────────────────────┴────────────────────┘
```

### Vehicle List

```
┌─────────────────────────────────────────────────────┐
│ Vehicles                          [+ Add Vehicle]    │
├─────────────────────────────────────────────────────┤
│ 🚚 Camion 01    12345-A-1    🟢 Active    [Edit][⋯] │
│ 🚚 Camion 02    54321-B-2    🟡 Idle      [Edit][⋯] │
│ 🛵 Scooter 01   11111-C-1    ⚫ Offline   [Edit][⋯] │
└─────────────────────────────────────────────────────┘
```
