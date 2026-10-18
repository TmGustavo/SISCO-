import { isManagedDocument } from './model.ts'
import type { ManagedDocument } from './types.ts'
export const DOCUMENT_STORAGE_KEY = 'kaluz.documentos.v1'
export function loadDocuments(storage: Pick<Storage, 'getItem'>): { documents: ManagedDocument[]; warning: string } {
  try { const raw = storage.getItem(DOCUMENT_STORAGE_KEY); if (raw === null) return { documents: [], warning: '' }; const parsed: unknown = JSON.parse(raw); if (!Array.isArray(parsed) || !parsed.every(isManagedDocument)) throw new Error(); return { documents: parsed, warning: '' } }
  catch { return { documents: [], warning: 'No se pudieron leer los documentos guardados. No se sobrescribirán los datos existentes.' } }
}
export function saveDocuments(storage: Pick<Storage, 'setItem'>, documents: ManagedDocument[]): boolean { try { storage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(documents)); return true } catch { return false } }
