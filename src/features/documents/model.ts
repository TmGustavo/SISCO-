import { localDate, validDate } from '../affiliates/model.ts'
import { documentTypes } from './types.ts'
import type { DocumentType, DocumentValues, ManagedDocument } from './types.ts'
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
export const documentLabels: Record<DocumentType, string> = { licencia: 'Licencia de conducir', carne: 'Carné', tarjeta_propiedad: 'Tarjeta de propiedad', dni: 'DNI', afocat: 'AFOCAT', soat: 'SOAT', revision_tecnica: 'Revisión técnica', gas: 'Certificación de gas', otro: 'Otro' }
export function documentState(document: ManagedDocument, today = localDate()): 'vigente' | 'por_vencer' | 'vencido' {
  if (document.expiresAt < today) return 'vencido'
  const limit = new Date(`${today}T12:00:00`); limit.setDate(limit.getDate() + 30)
  return document.expiresAt <= localDate(limit) ? 'por_vencer' : 'vigente'
}
export function validateDocument(value: DocumentValues, ownerIds: string[]): string[] {
  const errors: string[] = []
  if (!ownerIds.includes(value.ownerId)) errors.push('Selecciona un conductor o vehículo existente.')
  if (!documentTypes.includes(value.type)) errors.push('Selecciona un tipo de documento.')
  if (!value.number.trim()) errors.push('Ingresa el número de documento.')
  if (!validDate(value.issuedAt) || !validDate(value.expiresAt) || value.expiresAt < value.issuedAt) errors.push('Ingresa fechas válidas; el vencimiento no puede preceder a la emisión.')
  if (!value.fileName || !/^data:(application\/pdf|image\/(png|jpeg));base64,/.test(value.dataUrl)) errors.push('Adjunta un archivo PDF, PNG o JPEG válido.')
  if (value.dataUrl.length > 900_000) errors.push('El archivo supera el límite local de 650 KB.')
  return errors
}
export function createDocument(value: DocumentValues, now = new Date()): ManagedDocument { return { ...value, number: value.number.trim(), id: uid(), createdAt: now.toISOString() } }
export function isManagedDocument(input: unknown): input is ManagedDocument {
  if (!input || typeof input !== 'object') return false
  const d = input as ManagedDocument
  return ['id', 'ownerId', 'number', 'fileName', 'dataUrl', 'createdAt'].every(k => typeof (d as unknown as Record<string, unknown>)[k] === 'string') && ['conductor', 'vehiculo'].includes(d.ownerType) && documentTypes.includes(d.type) && validDate(d.issuedAt) && validDate(d.expiresAt) && d.expiresAt >= d.issuedAt && !Number.isNaN(Date.parse(d.createdAt)) && /^data:(application\/pdf|image\/(png|jpeg));base64,/.test(d.dataUrl)
}
