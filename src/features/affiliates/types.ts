export type AffiliateStatus = 'activo' | 'pendiente' | 'suspendido'
export type AffiliationType = 'propietario' | 'alquilado'

export interface AffiliateFee {
  id: string
  period: string
  dueDate: string
  amountCents: number
  paidAt: string | null
  payments?: AffiliatePayment[]
}

export interface AffiliatePayment {
  id: string
  amountCents: number
  paidAt: string
  method: string
  reference: string
}

export interface AffiliateHistory {
  id: string
  date: string
  description: string
}

export interface Affiliate {
  id: string
  name: string
  identity: string
  email: string
  phone: string
  address: string
  joinedAt: string
  type: AffiliationType
  status: AffiliateStatus
  requestId: string
  vehicle: { plate: string; brand: string; model: string; year: string; color: string }
  monthlyFeeCents: number
  fees: AffiliateFee[]
  history: AffiliateHistory[]
}

export interface AffiliateFormValues {
  name: string
  identity: string
  email: string
  phone: string
  address: string
  joinedAt: string
  type: AffiliationType
  status: AffiliateStatus
  requestId: string
  plate: string
  brand: string
  model: string
  year: string
  color: string
  monthlyFee: string
}

export type FormErrors = Partial<Record<keyof AffiliateFormValues, string>>
