# 04 — Driver Mode: The Crazy Taxi Experience

## Overview
Driver Mode flips the perspective from fleet manager to individual driver. Inspired by Crazy Taxi, players drive a Nissan Sunny through Egyptian streets, accepting ride requests, earning fares, and experiencing the driver's economic reality firsthand.

## Why Driver Mode Matters for Adel

### Product Understanding
A Growth & Commercial Director needs to internalize the driver experience. Driver Mode demonstrates:
- **Supply-side economics**: How fare structures, surge, and dead miles affect driver earnings
- **Behavioral incentives**: Why drivers cluster in certain areas and avoid others
- **Payout sensitivity**: Real-time feel for how payout percentage changes affect take-home pay

### Interactive Proof Points
1. **Accept a ride in Downtown at 1.8x surge** → See the premium fare
2. **Drive dead miles in 6th October** → Feel the empty repositioning cost
3. **Chain rides in 5th Settlement** → Experience the low-dead-mile goldmine

## Controls

### Desktop
| Key | Action |
|-----|--------|
| W / ↑ | Accelerate |
| S / ↓ | Brake / Reverse |
| A / ← | Turn Left |
| D / → | Turn Right |

### Mobile
- Thumb joystick (planned)
- Tap-to-accept ride requests

## HUD Elements
- **Speedometer**: Current speed in km/h
- **Earnings counter**: Running total for the session
- **Trip counter**: Total completed rides
- **Ride queue**: Incoming ride requests with countdown timers
- **Active ride panel**: Pickup, dropoff, distance, fare

## Ride Generation Algorithm
```typescript
// Rides appear every 5 seconds with random parameters
const distance = 3 + Math.random() * 12  // 3-15 km
const fare = calcFare(zone.baseFare, zone.perKm, distance, zone.surge)
const timeToAccept = 15 // seconds before request expires
```

## Economic Insights from Driving
After a 10-minute driving session, players typically discover:
- **High-surge zones feel profitable** but trips are short
- **Dead miles are invisible costs** that erode earnings
- **Ride queue management matters** — accepting the right ride > accepting every ride

## Technical Architecture
- **3D Engine**: React-Three-Fiber with arcade car physics
- **Camera**: Third-person follow camera with smooth lerp
- **Headlights**: PointLight attached to player mesh
- **Car model**: Procedural box geometry (lightweight, instant load)

---
*Part of the Arrw Portfolio by Mohamed Negm*
