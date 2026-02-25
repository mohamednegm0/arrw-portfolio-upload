# 02 — Unit Economics Engine

## Overview
The economics engine is a set of pure TypeScript functions that compute Arrw's core financial metrics. Every slider movement in the UI triggers recalculation, demonstrating real-time sensitivity analysis.

## Core Formulas

### Fare Calculation
```
fare = (base_fare + per_km × distance) × surge_multiplier
```

### Driver Payout
```
driver_payout = fare × (payout_pct / 100)
arrw_commission = fare × (1 - payout_pct / 100)
```

### Dead Mile Cost
```
dead_mile_cost = dead_miles × fuel_cost_per_km
```
Default fuel cost: 1.2 EGP/km (Egypt average for Nissan Sunny fleet)

### Net Revenue Per Trip
```
net_revenue = arrw_commission - dead_mile_cost
```
A trip is profitable when net_revenue > 0.

### Customer Lifetime Value (LTV)
```
LTV = avg_trips_per_month × avg_fare × margin_pct × lifetime_months
```
Default: 8 trips × 45 EGP × 25% margin × 18 months = **1,620 EGP**

### Customer Acquisition Cost (CAC)
```
CAC = total_marketing_spend / new_customers_acquired
```

### LTV:CAC Ratio
```
ratio = LTV / CAC
```
- **> 3.0**: Healthy — sustainable growth
- **2.0 – 3.0**: Caution — optimize acquisition
- **< 2.0**: Danger — burning cash

## Zone Economics Comparison

| Zone | Base Fare | Per KM | Surge | Payout | Dead Miles | Net/Trip |
|------|-----------|--------|-------|--------|------------|----------|
| Alexandria | 12 EGP | 3.5 | 1.0x | 75% | 3.1 km | ~3.5 EGP |
| 6th October | 10 EGP | 3.0 | 1.0x | 75% | 4.2 km | ~0.2 EGP |
| Ring Road | 15 EGP | 2.5 | 1.2x | 70% | 5.5 km | ~9.6 EGP |
| 5th Settlement | 18 EGP | 4.0 | 1.0x | 72% | 2.8 km | ~7.9 EGP |
| New Cairo | 14 EGP | 3.5 | 1.1x | 73% | 3.5 km | ~5.5 EGP |
| Downtown | 8 EGP | 4.5 | 1.8x | 68% | 1.5 km | ~7.9 EGP |

## Insight: Dead Miles Are The Silent Margin Killer
6th October has the highest dead miles (4.2 km), making it barely profitable at 0.2 EGP/trip. Strategy: cluster drivers near demand hubs (malls, universities) to reduce repositioning costs.

---
*Part of the Arrw Portfolio by Mohamed Negm*
