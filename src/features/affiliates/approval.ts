import { applyAction } from '../solicitudes/model.ts'
import { STORAGE_KEY as REQUESTS_KEY } from '../solicitudes/storage.ts'
import type { Solicitud } from '../solicitudes/types.ts'
import { changeStatus, saveAffiliate, toForm, validateForm } from './model.ts'
import { STORAGE_KEY as AFFILIATES_KEY } from './storage.ts'
import type { Affiliate, AffiliateFormValues } from './types.ts'

export function prepareApproval(requestId: string, affiliates: Affiliate[], requests: Solicitud[], values?: AffiliateFormValues) {
  const request = requests.find(item => item.id === requestId)
  if (!request || request.type !== 'afiliacion') throw new Error('La solicitud de afiliación ya no está disponible.')
  if (request.status === 'rechazada') throw new Error('La solicitud está rechazada; revisa su estado en Solicitudes antes de continuar.')
  const linked = affiliates.find(item => item.requestId === requestId)
  const byIdentity = affiliates.find(item => item.identity === request.identity)
  if ((linked && linked.identity !== request.identity) || (linked && byIdentity && linked.id !== byIdentity.id)) throw new Error('Hay datos de afiliación contradictorios. Revisa la solicitud y el padrón.')
  const existing = linked ?? byIdentity
  if (existing && existing.requestId && existing.requestId !== requestId) throw new Error('El DNI ya está vinculado a otra solicitud; revisa la ficha existente.')
  if (existing && values) throw new Error('El DNI ya está registrado. Abre la solicitud de nuevo para actualizar la ficha existente.')
  if (!existing && !values) throw new Error('Completa la ficha del nuevo afiliado para aprobar la solicitud.')
  const finalValues = existing ? { ...toForm(existing), requestId, status: 'activo' as const } : { ...values!, requestId, status: 'activo' as const }
  const errors = validateForm(finalValues, affiliates, requests, existing?.id)
  if (Object.keys(errors).length) throw new Error('Revisa los datos de la ficha y evita DNI, placas o solicitudes duplicadas antes de aprobar.')
  const affiliate = existing ? changeStatus({ ...existing, requestId }, 'activo') : saveAffiliate(finalValues)
  const nextAffiliates = existing ? affiliates.map(item => item.id === existing.id ? affiliate : item) : [affiliate, ...affiliates]
  const nextRequests = requests.map(item => item.id === requestId && item.status !== 'aprobada' ? applyAction(item, 'aprobar') : item)
  return { affiliate, affiliates: nextAffiliates, requests: nextRequests }
}

export function storeApproval(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>, affiliates: Affiliate[], requests: Solicitud[]): string {
  let oldAffiliates: string | null
  try { oldAffiliates = storage.getItem(AFFILIATES_KEY) } catch { return 'No se pudo acceder al almacenamiento local. No se aprobó la solicitud.' }
  try { storage.setItem(AFFILIATES_KEY, JSON.stringify(affiliates)) } catch { return 'No se pudo guardar la ficha. No se aprobó la solicitud.' }
  try { storage.setItem(REQUESTS_KEY, JSON.stringify(requests)); return '' } catch {
    try { if (oldAffiliates === null) storage.removeItem(AFFILIATES_KEY); else storage.setItem(AFFILIATES_KEY, oldAffiliates) }
    catch { return 'No se pudo completar la aprobación ni recuperar la ficha anterior. Revisa ambos módulos antes de continuar.' }
    return 'No se pudo guardar la solicitud. La ficha volvió a su estado anterior.'
  }
}
