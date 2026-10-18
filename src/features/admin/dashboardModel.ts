import { debt, feeBalance, localDate } from '../affiliates/model.ts'
import type { Affiliate } from '../affiliates/types.ts'
import { documentState } from '../documents/model.ts'
import type { ManagedDocument } from '../documents/types.ts'
import type { Driver } from '../drivers/types.ts'
import { activeRental, rentalBalance } from '../rentals/model.ts'
import type { Rental } from '../rentals/types.ts'
import type { Solicitud } from '../solicitudes/types.ts'
import type { VehicleView } from '../vehicles/types.ts'

export interface DashboardData { affiliates: Affiliate[]; drivers: Driver[]; vehicles: VehicleView[]; documents: ManagedDocument[]; requests: Solicitud[]; rentals: Rental[] }
export interface DashboardPayment { date: string; cents: number; type: 'cuotas' | 'alquileres' }
export function dashboardPayments(data: DashboardData): DashboardPayment[] {
  const fees = data.affiliates.flatMap(a => a.fees.flatMap(f => f.payments?.length ? f.payments.map(p => ({ date: p.paidAt, cents: p.amountCents, type: 'cuotas' as const })) : f.paidAt ? [{ date: f.paidAt, cents: f.amountCents, type: 'cuotas' as const }] : []))
  return [...fees, ...data.rentals.flatMap(r => r.payments.map(p => ({ date: p.paidAt, cents: p.amountCents, type: 'alquileres' as const })))]
}
export function dashboardStats(data: DashboardData, today = localDate()) {
  const outstandingFees = data.affiliates.flatMap(a => a.fees).filter(f => feeBalance(f) > 0)
  return { activeAffiliates: data.affiliates.filter(a => a.status === 'activo').length, activeDrivers: data.drivers.filter(d => d.status === 'activo').length, operatingVehicles: data.vehicles.filter(v => v.status === 'operacion').length, pendingFees: outstandingFees.length, newRequests: data.requests.filter(r => r.status === 'pendiente').length, expiringDocuments: data.documents.filter(d => documentState(d, today) === 'por_vencer').length, overdueDocuments: data.documents.filter(d => documentState(d, today) === 'vencido').length, debt: data.affiliates.reduce((sum, a) => sum + debt(a, today), 0), activeRentals: data.rentals.filter(activeRental).length, rentalBalance: data.rentals.filter(r => r.status !== 'cancelado').reduce((sum, r) => sum + rentalBalance(r), 0) }
}
export function monthlyTotals(payments: DashboardPayment[], year: number): number[] {
  const totals = Array.from({ length: 12 }, () => 0)
  for (const payment of payments) { const date = new Date(payment.date); if (!Number.isNaN(date.getTime()) && date.getFullYear() === year) totals[date.getMonth()] += payment.cents }
  return totals
}
