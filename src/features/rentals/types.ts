export type RentalStatus = 'reservado' | 'en_curso' | 'finalizado' | 'cancelado'
export interface RentalPayment { id: string; amountCents: number; paidAt: string; method: string; reference: string }
export interface RentalHistory { id: string; date: string; description: string }
export interface Rental { id: string; vehicleId: string; client: string; phone: string; destination: string; start: string; end: string; totalCents: number; status: RentalStatus; payments: RentalPayment[]; history: RentalHistory[] }
export interface RentalValues { vehicleId: string; client: string; phone: string; destination: string; start: string; end: string; total: string }
