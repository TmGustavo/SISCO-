import { useEffect, useState } from 'react'
import { formatDate } from '../affiliates/model.ts'
import { documentLabels, documentState } from './model.ts'
import { DOCUMENT_STORAGE_KEY, loadDocuments } from './storage.ts'
import type { DocumentOwner, ManagedDocument } from './types.ts'
const labels = { vigente: 'Fecha vigente', por_vencer: 'Por vencer', vencido: 'Vencido' } as const
export function RelatedDocuments({ ownerId, ownerType }: { ownerId: string; ownerType: DocumentOwner }) {
  const [data, setData] = useState<ManagedDocument[]>(() => { try { return loadDocuments(window.localStorage).documents } catch { return [] } })
  useEffect(() => { const refresh = (e: StorageEvent) => { if (e.key === DOCUMENT_STORAGE_KEY) { try { setData(loadDocuments(window.localStorage).documents) } catch { setData([]) } } }; window.addEventListener('storage', refresh); return () => window.removeEventListener('storage', refresh) }, [])
  const relevant = data.filter(d => d.ownerType === ownerType && d.ownerId === ownerId)
  return relevant.length ? <section className="space-y-2"><h4 className="font-bold">Documentos registrados</h4>{relevant.map(d => <div key={d.id} className="rounded border border-slate-200 p-3 text-sm"><p className="font-semibold">{documentLabels[d.type]} · {d.number}</p><p className="text-xs text-slate-500">{labels[documentState(d)]} · {formatDate(d.expiresAt)}</p><a href={d.dataUrl} download={d.fileName} className="inline-flex min-h-11 items-center text-blue-700 underline">Descargar</a></div>)}</section> : null
}
