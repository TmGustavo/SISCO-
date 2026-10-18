export const requestTypes = ['afiliacion', 'conductores', 'alquileres', 'turismo'] as const
export type RequestType = (typeof requestTypes)[number]

export const requestStatuses = ['pendiente', 'en_revision', 'aprobada', 'observada', 'rechazada'] as const
export type RequestStatus = (typeof requestStatuses)[number]
export type RequestAction = 'revisar' | 'aprobar' | 'observar' | 'rechazar'

export interface RequestDocument {
  id: string
  name: string
  received: boolean
  fileName?: string
  dataUrl?: string
}

export interface RequestRequirement {
  id: string
  name: string
  checked: boolean
}

export interface RequestHistoryEntry {
  id: string
  date: string
  description: string
  note?: string
}

export interface Solicitud {
  id: string
  type: RequestType
  status: RequestStatus
  name: string
  identity: string
  email: string
  phone: string
  reference: string
  serviceDate: string
  description: string
  createdAt: string
  documents: RequestDocument[]
  requirements: RequestRequirement[]
  history: RequestHistoryEntry[]
}

export interface RequestFormValues {
  type: RequestType
  name: string
  identity: string
  email: string
  phone: string
  reference: string
  serviceDate: string
  description: string
}

export type FormErrors = Partial<Record<keyof RequestFormValues, string>>
