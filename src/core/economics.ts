// ============================================
// Arrw Portfolio — Unit Economics Engine
// Pure functions for mobility economics
// ============================================

import type { Zone } from '../store/gameStore'

/**
 * Calculate fleet utilization rate
 * Revenue Hours / Total Available Hours
 */
export function calcUtilization(
  revenueHours: number,
  totalHours: number
): number {
  if (totalHours <= 0) return 0
  return Math.min((revenueHours / totalHours) * 100, 100)
}

/**
 * Calculate fare for a trip
 * base_fare + (per_km × distance) × surge
 */
export function calcFare(
  baseFare: number,
  perKm: number,
  distance: number,
  surge: number = 1.0
): number {
  return Math.round((baseFare + perKm * distance) * surge * 100) / 100
}

/**
 * Calculate driver payout from a fare
 */
export function calcDriverPayout(fare: number, payoutPct: number): number {
  return Math.round(fare * (payoutPct / 100) * 100) / 100
}

/**
 * Calculate Arrw's take (commission) from a fare
 */
export function calcCommission(fare: number, payoutPct: number): number {
  return Math.round(fare * (1 - payoutPct / 100) * 100) / 100
}

/**
 * Calculate dead mile cost
 * Dead miles incur fuel cost with no revenue
 * Cost ≈ dead_miles × fuel_cost_per_km
 */
export function calcDeadMileCost(
  deadMiles: number,
  fuelCostPerKm: number = 1.2 // EGP
): number {
  return Math.round(deadMiles * fuelCostPerKm * 100) / 100
}

/**
 * Calculate net revenue per trip for Arrw
 */
export function calcNetRevenuePerTrip(
  fare: number,
  payoutPct: number,
  deadMiles: number,
  fuelCostPerKm: number = 1.2
): number {
  const commission = calcCommission(fare, payoutPct)
  const deadCost = calcDeadMileCost(deadMiles, fuelCostPerKm)
  return Math.round((commission - deadCost) * 100) / 100
}

/**
 * Calculate Customer Lifetime Value
 * LTV = avg_trips_per_month × avg_fare × margin × avg_lifetime_months
 */
export function calcLTV(
  avgTripsPerMonth: number = 8,
  avgFare: number = 45,
  marginPct: number = 25,
  lifetimeMonths: number = 18
): number {
  return Math.round(avgTripsPerMonth * avgFare * (marginPct / 100) * lifetimeMonths)
}

/**
 * Calculate Customer Acquisition Cost
 * CAC = total_marketing_spend / new_customers_acquired
 */
export function calcCAC(
  marketingSpend: number,
  newCustomers: number
): number {
  if (newCustomers <= 0) return 0
  return Math.round(marketingSpend / newCustomers)
}

/**
 * LTV:CAC ratio — healthy if > 3
 */
export function calcLTVtoCACRatio(ltv: number, cac: number): number {
  if (cac <= 0) return 0
  return Math.round((ltv / cac) * 100) / 100
}

/**
 * Calculate required drivers for a zone
 * Based on rider demand and target wait time
 */
export function calcRequiredDrivers(
  riderDemandPerHour: number,
  avgTripMinutes: number = 15,
  targetWaitMinutes: number = 5,
  utilizationTarget: number = 70
): number {
  const tripsPerDriverPerHour = 60 / (avgTripMinutes + targetWaitMinutes)
  const rawDrivers = riderDemandPerHour / tripsPerDriverPerHour
  return Math.ceil(rawDrivers / (utilizationTarget / 100))
}

/**
 * Calculate zone-level profitability per hour
 */
export function calcZoneProfitPerHour(zone: Zone, tripsPerHour: number): number {
  const avgFare = calcFare(zone.baseFare, zone.perKm, zone.avgTrip, zone.surge)
  const netPerTrip = calcNetRevenuePerTrip(avgFare, zone.payoutPct, zone.deadMiles)
  return Math.round(netPerTrip * tripsPerHour * 100) / 100
}

/**
 * Generate a summary of zone economics
 * globalSurge multiplies the zone surge; globalPayoutPct overrides zone payout if provided
 */
export function getZoneSummary(zone: Zone, globalSurge: number = 1.0, globalPayoutPct?: number) {
  const effectiveSurge = zone.surge * globalSurge
  const effectivePayout = globalPayoutPct ?? zone.payoutPct
  const avgFare = calcFare(zone.baseFare, zone.perKm, zone.avgTrip, effectiveSurge)
  const driverPayout = calcDriverPayout(avgFare, effectivePayout)
  const commission = calcCommission(avgFare, effectivePayout)
  const deadCost = calcDeadMileCost(zone.deadMiles)
  const netRevenue = calcNetRevenuePerTrip(avgFare, effectivePayout, zone.deadMiles)
  
  return {
    zoneName: zone.name,
    avgFare,
    driverPayout,
    arrwCommission: commission,
    deadMileCost: deadCost,
    netRevenuePerTrip: netRevenue,
    estimatedTripsPerHour: Math.round(zone.riders / Math.max(zone.drivers, 1) * 10) / 10,
    profitablePerTrip: netRevenue > 0,
  }
}

/**
 * Format a number as Egyptian Pounds
 */
export function formatEGP(amount: number): string {
  return `${amount.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} EGP`
}

/**
 * Format a percentage
 */
export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`
}
