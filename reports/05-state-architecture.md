# 05 — State Architecture & Technical Design

## Overview
The portfolio uses a carefully designed state architecture that bridges 2D (Phaser), 3D (React-Three-Fiber), and UI (React) modules through a single Zustand store. This document explains the why and how.

## Tech Stack Decision Matrix

| Category | Choice | Why | Alternatives Rejected |
|----------|--------|-----|----------------------|
| Framework | React 18 + Vite | Fast HMR, native JSX, ecosystem | Next.js (SSR unnecessary), CRA (dead) |
| 2D Engine | Phaser 3 | 300KB gz, arcade physics, Canvas/WebGL | PixiJS (no physics), Unity (80MB bundle) |
| 3D Engine | React-Three-Fiber | Native React, declarative, tiny | Babylon (1.2MB), PlayCanvas (editor-centric) |
| State | Zustand | 3KB, works outside React tree | Redux (boilerplate), Context (can't bridge Phaser) |
| SQL | AlaSQL | 200KB, browser-native, real SQL | sql.js (1.5MB WASM), DuckDB (2.5MB) |
| Styling | TailwindCSS 3 | Utility-first, purge unused CSS | CSS Modules (verbose), Styled Components (runtime) |
| Animation | Framer Motion | React-native transitions, layout animations | GSAP (not React-native), CSS (limited) |

## Store Architecture

```
┌─────────────────────────────────────────────┐
│                ZUSTAND STORE                 │
├─────────────────┬───────────┬───────────────┤
│  AppSlice       │ Narrative │  FleetSlice   │
│  ─────────      │  Slice    │  ──────────   │
│  gameMode       │ ────────  │  drivers[]    │
│  language       │ level     │  rides[]      │
│  showSQL        │ dialogue  │  activeZone   │
│  onboarding     │ xp        │  simSpeed     │
│                 │ achieve.  │  simRunning   │
├─────────────────┴───────────┴───────────────┤
│              EconomicsSlice                  │
│              ───────────────                 │
│              zones[], globalSurge,           │
│              globalPayoutPct, cac, ltv       │
└─────────────────────────────────────────────┘
```

### Why Zustand Over Redux/Context?

1. **Phaser Bridge**: Phaser runs outside React's component tree. Zustand's `getState()` and `subscribe()` work anywhere:
   ```typescript
   // Inside Phaser scene (not a React component)
   useGameStore.getState().addXP(50)
   useGameStore.subscribe((state) => { /* react to changes */ })
   ```

2. **Zero Boilerplate**: No providers, reducers, or action types. Define state and actions in one place.

3. **Selective Re-renders**: `subscribeWithSelector` middleware enables fine-grained subscriptions without `useMemo`/`useCallback` overhead.

## Data Flow

```
User Input → Zustand Action → State Update
                                  ↓
              ┌───────────────────┼───────────────────┐
              ↓                   ↓                   ↓
         Phaser Scene       R3F Canvas          React UI
         (subscribe)        (useStore)        (useStore)
```

## SQL Integration

AlaSQL queries Zustand state as virtual tables:
```sql
-- Zones table (virtual, from Zustand)
SELECT name, baseFare, perKm, surge, payoutPct
FROM zones
WHERE status = 'active'
ORDER BY baseFare DESC
```

The SQL Terminal dynamically imports AlaSQL and passes current zone data as the query source. Zero persistence — purely in-memory, real-time.

## Performance Budget

| Asset | Size (gzipped) | Load Time (3G) |
|-------|----------------|-----------------|
| React + ReactDOM | ~45 KB | ~0.3s |
| Phaser 3 | ~300 KB | ~1.5s |
| Three.js + R3F + Drei | ~250 KB | ~1.2s |
| Zustand | ~3 KB | <0.1s |
| AlaSQL | ~200 KB | ~1.0s |
| Framer Motion | ~40 KB | ~0.2s |
| App Code | ~30 KB | ~0.2s |
| **Total** | **~870 KB** | **~2.5s** |

Phaser and AlaSQL are lazy-loaded (dynamic import) to keep initial bundle under 400KB.

## Security & Privacy
- No backend, no API calls, no data persistence
- All computation runs client-side in the browser
- No cookies, no tracking, no analytics
- Safe to run on corporate networks

---
*Part of the Arrw Portfolio by Mohamed Negm*
