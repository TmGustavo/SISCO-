import { addFee, emptyForm, isAffiliate, localDate, payFee, saveAffiliate } from './model.ts'
import type { Affiliate, AffiliateFormValues } from './types.ts'

export const STORAGE_KEY = 'kaluz.afiliados.v1'

export function seedAffiliates(now = new Date()): Affiliate[] {
  const rows: Array<Partial<AffiliateFormValues>> = [
    { name: 'María Fernanda Rojas', identity: '45871932', email: 'maria.rojas@ejemplo.com', phone: '987654321', requestId: 'SOL-1001', plate: 'ABC-123', status: 'pendiente' },
    { name: 'Rosa Elena Quispe', identity: '46832195', email: 'rosa.quispe@ejemplo.com', phone: '989225630', requestId: 'SOL-1005', plate: 'BDF-452', status: 'pendiente' },
    { name: 'Carlos Mendoza Quispe', identity: '45217896', email: 'carlos.mendoza@ejemplo.com', phone: '964532121', plate: 'WAR-732', status: 'activo' },
    { name: 'Juan Carlos Pérez', identity: '42765109', email: 'juan.perez@ejemplo.com', phone: '954111876', plate: 'B2K-331', status: 'activo' },
    { name: 'Jorge Luis Rivera', identity: '44321987', email: 'jorge.rivera@ejemplo.com', phone: '964332771', plate: 'X5L-901', status: 'activo', type: 'alquilado' },
    { name: 'Víctor Huamán Soto', identity: '42167832', email: 'victor.huaman@ejemplo.com', phone: '954778663', plate: 'W4R-521', status: 'suspendido' },
  ]
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 10)
  return rows.map((row, i) => {
    const values = { ...emptyForm(), address: 'Av. Huancavelica 123, Huancayo', joinedAt: '2023-03-15', brand: i % 2 ? 'Hyundai' : 'Toyota', model: i % 2 ? 'Accent' : 'Yaris', year: '2021', color: 'Plata', monthlyFee: '120.00', ...row }
    let a = saveAffiliate(values, undefined, now)
    a = { ...a, id: `AFI-${String(i + 1).padStart(3, '0')}` }
    if (i >= 2) {
      a = addFee(a, localDate(lastMonth).slice(0, 7), localDate(lastMonth), 12000, now)
      if (i < 4) a = payFee(a, a.fees[0].id, now)
      a = addFee(a, localDate(thisMonth).slice(0, 7), localDate(thisMonth), 12000, now)
      if (i === 2) a = payFee(a, a.fees[1].id, now)
    }
    return a
  })
}

export function loadAffiliates(storage: Pick<Storage, 'getItem'>): { affiliates: Affiliate[]; warning: string } {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return { affiliates: seedAffiliates(), warning: '' }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every(isAffiliate)) throw new Error('Invalid data')
    return { affiliates: parsed, warning: '' }
  } catch {
    return { affiliates: seedAffiliates(), warning: 'No se pudieron leer los datos locales. Se muestran ejemplos y se protege el contenido almacenado hasta que sea revisado.' }
  }
}
export function saveAffiliates(storage: Pick<Storage, 'setItem'>, affiliates: Affiliate[]): boolean {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(affiliates)); return true } catch { return false }
}
