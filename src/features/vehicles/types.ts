export type VehicleStatus = 'operacion' | 'mantenimiento' | 'por_aprobar' | 'inactivo'
export type VehicleOrigin = 'afiliado' | 'propio'
export interface VehicleInfo { plate: string; brand: string; model: string; year: string; color: string }
export interface Maintenance { id: string; date: string; description: string }
export interface VehicleRecord {
  id: string
  origin: VehicleOrigin
  affiliateId: string
  ownInfo: VehicleInfo | null
  status: VehicleStatus
  capacity: number
  maintenance: Maintenance[]
  history: Maintenance[]
}
export interface VehicleView extends VehicleRecord { info: VehicleInfo; owner: string }
export interface VehicleFormValues extends VehicleInfo { origin: VehicleOrigin; affiliateId: string; status: VehicleStatus; capacity: string }
