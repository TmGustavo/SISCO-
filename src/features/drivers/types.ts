export type DriverStatus = 'activo' | 'en_proceso' | 'observado' | 'inactivo'
export type DriverAvailability = 'disponible' | 'ocupado' | 'fuera_linea'
export interface DriverHistory { id: string; date: string; description: string }
export interface Driver {
  id: string
  name: string
  identity: string
  phone: string
  email: string
  address: string
  licenseNumber: string
  licenseCategory: string
  licenseIssuedAt: string
  licenseExpiresAt: string
  experienceYears: number
  status: DriverStatus
  availability: DriverAvailability
  vehiclePlate: string
  requestId: string
  history: DriverHistory[]
}
export type DriverFormValues = Omit<Driver, 'id' | 'experienceYears' | 'history'> & { experienceYears: string }
export type DriverErrors = Partial<Record<keyof DriverFormValues, string>>
