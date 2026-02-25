# 01 — Mission Control: Fleet Operations Dashboard

## Overview
The Mission Control module provides a real-time, top-down view of Arrw's fleet operations across all Egyptian zones. Built with React-Three-Fiber, it renders taxi units, zone boundaries, and demand heatmaps in an interactive 3D environment.

## Key Features

### Real-Time Fleet Visualization
- **3D city map** with zone markers for Alexandria, 6th October, Ring Road, 5th Settlement, New Cairo, and Downtown Cairo
- **Taxi cab sprites** with status-colored indicators (green = idle, amber = on-trip, red = offline)
- **Simulation controls**: Play/Pause, speed multiplier (0.5x – 5x)

### Zone Management
- Click zone markers to focus and view zone-specific KPIs
- Zone status: Active (generating revenue), Expansion (planned), Locked (not yet approved)
- Color-coded zones for instant visual differentiation

### Metrics Dashboard
| Metric | Formula | Target |
|--------|---------|--------|
| Utilization | Revenue Hours / Total Hours | > 70% |
| Avg Fare | base_fare + (per_km × distance) × surge | Zone-dependent |
| Net Revenue/Trip | Commission – Dead Mile Cost | > 0 EGP |
| Active Drivers | Count(status = 'idle' OR 'on-trip') | Zone-dependent |

## Architecture
- **Renderer**: React-Three-Fiber with Drei helpers
- **State**: Zustand `fleetSlice` — drivers[], rides[], activeZone
- **Physics**: Simplified arcade movement (no Rapier needed for top-down)
- **Camera**: OrbitControls with pan, zoom, and polar angle limits

## Integration Points
- Fleet state bridges to Economics module via shared Zustand store
- Zone selection syncs between 3D view and Economics Control Panel
- Driver data queryable via SQL Terminal (`SELECT * FROM drivers WHERE zone = 'alex'`)

---
*Part of the Arrw Portfolio by Mohamed Negm*
