import { isRental } from './model.ts'
import type { Rental } from './types.ts'
export const RENTAL_STORAGE_KEY = 'kaluz.alquileres.v1'
export function loadRentals(storage: Pick<Storage, 'getItem'>): { rentals: Rental[]; warning: string } { try { const raw = storage.getItem(RENTAL_STORAGE_KEY); if (raw === null) return { rentals: [], warning: '' }; const parsed: unknown = JSON.parse(raw); if (!Array.isArray(parsed) || !parsed.every(isRental)) throw new Error(); return { rentals: parsed, warning: '' } } catch { return { rentals: [], warning: 'No se pudieron leer los alquileres guardados. No se sobrescribirán los datos existentes.' } } }
export function saveRentals(storage: Pick<Storage, 'setItem'>, rentals: Rental[]): boolean { try { storage.setItem(RENTAL_STORAGE_KEY, JSON.stringify(rentals)); return true } catch { return false } }
