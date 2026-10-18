import { useRef, useState } from 'react'
import { useEffect } from 'react'
import { Check, ClipboardCheck, Download, FileText, Upload, X } from 'lucide-react'
import { referenceLabels, statusLabels, typeLabels } from './model.ts'
import type { RequestAction, RequestDocument, Solicitud } from './types.ts'
import { StatusBadge, displayId, formatDate } from './ui.tsx'
import { useModalFocus } from './useModalFocus.ts'

interface Props {
  request: Solicitud
  onClose: () => void
  onChange: (update: (request: Solicitud) => Solicitud) => void
  onAction: (action: RequestAction, note: string) => void
  embedded?: boolean
}

export function RequestDetail({ request, onClose, onChange, onAction, embedded = false }: Props) {
  const [pendingAction, setPendingAction] = useState<'observar' | 'rechazar' | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  useModalFocus(dialogRef, onClose, !embedded)
  useEffect(() => { if (pendingAction) noteRef.current?.focus() }, [pendingAction])
  function updateDocument(id: string, update: Partial<RequestDocument>) {
    onChange((current) => ({ ...current, documents: current.documents.map((doc) => doc.id === id ? { ...doc, ...update } : doc) }))
  }
  function uploadFile(id: string, file: File | undefined) {
    if (!file) return
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 1_000_000) { setError('Elige un PDF, JPG o PNG de máximo 1 MB.'); return }
    setError('')
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === 'string') updateDocument(id, { received: true, fileName: file.name, dataUrl: reader.result }) }
    reader.onerror = () => setError('No se pudo leer el archivo. Inténtalo nuevamente.')
    reader.readAsDataURL(file)
  }
  function act(action: RequestAction) {
    if (action === 'observar' || action === 'rechazar') { setPendingAction(action); setNote(''); setError(''); return }
    onAction(action, '')
    setPendingAction(null)
  }
  function submitAction() {
    if (!pendingAction) return
    if (!note.trim()) { setError('Escribe un motivo para continuar.'); return }
    onAction(pendingAction, note)
    setPendingAction(null); setNote(''); setError('')
  }
  const completed = request.documents.filter((doc) => doc.received).length
  return <div className={embedded ? 'h-full' : 'fixed inset-0 z-50 flex justify-end bg-slate-950/50'} onMouseDown={(event) => { if (!embedded && event.target === event.currentTarget) onClose() }}>
    <aside ref={dialogRef} role={embedded ? undefined : 'dialog'} aria-modal={embedded ? undefined : true} aria-label={`Detalle de ${request.name}`} className={`flex w-full flex-col bg-white ${embedded ? 'max-h-[950px] overflow-hidden rounded-xl border border-slate-200 shadow-sm' : 'h-dvh max-w-xl shadow-2xl'}`}>
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-wider text-[#123b82]">Detalle de solicitud</p><h2 className="mt-1 text-xl font-bold text-[#071b46]">{displayId(request.id)}</h2><p className="mt-1 text-sm text-slate-500">Registrada el {formatDate(request.createdAt)}</p></div>{!embedded && <button data-autofocus type="button" onClick={onClose} aria-label="Cerrar detalle" className="flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={20} /></button>}</div>
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-7">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">{typeLabels[request.type]}</span><StatusBadge status={request.status} /></div>
        <section><h3 className="text-sm font-bold text-slate-900">Información del solicitante</h3><dl className="mt-4 grid grid-cols-1 gap-x-5 gap-y-4 text-sm sm:grid-cols-2">{[['Nombre completo', request.name], ['Documento de identidad', request.identity], ['Correo electrónico', request.email], ['Teléfono', request.phone], [referenceLabels[request.type], request.reference], ...(request.serviceDate ? [['Fecha solicitada', formatDate(request.serviceDate)]] : [])].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words font-medium text-slate-800">{value}</dd></div>)}</dl>{request.description && <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><span className="block text-xs font-semibold text-slate-500">Información adicional</span><p className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{request.description}</p></div>}</section>
        <section><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><FileText size={17} className="text-teal-700" /> Documentos</h3><span className="text-xs text-slate-500">{completed} de {request.documents.length} recibidos</span></div><p className="mt-2 text-xs leading-5 text-slate-500">Marca los documentos recibidos o adjunta un archivo PDF, JPG o PNG de hasta 1 MB. Los archivos se guardan solo en este navegador.</p><div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">{request.documents.map((doc) => <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 p-3"><label className="flex min-h-11 min-w-0 items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={doc.received} onChange={(event) => updateDocument(doc.id, { received: event.target.checked })} className="size-5 accent-teal-700" /><span>{doc.name}</span></label><div className="flex items-center gap-2">{doc.dataUrl && /^data:(application\/pdf|image\/(jpeg|png));base64,/i.test(doc.dataUrl) && <a href={doc.dataUrl} download={doc.fileName || 'documento'} className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50"><Download size={14} /> Descargar</a>}<label className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs focus-within:ring-2 focus-within:ring-teal-600 font-semibold text-teal-700 hover:bg-teal-50"><Upload size={14} /> {doc.fileName ? 'Cambiar' : 'Adjuntar'}<input type="file" aria-label={`Adjuntar ${doc.name}`} className="sr-only" accept="application/pdf,image/jpeg,image/png" onChange={(event) => { uploadFile(doc.id, event.target.files?.[0]); event.currentTarget.value = '' }} /></label></div>{doc.fileName && <span className="w-full truncate pl-6 text-xs text-slate-500">{doc.fileName}</span>}</div>)}</div></section>
        <section><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><ClipboardCheck size={17} className="text-teal-700" /> Requisitos</h3><div className="mt-3 space-y-3">{request.requirements.map((requirement) => <label key={requirement.id} className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-teal-700" checked={requirement.checked} onChange={(event) => { const checked = event.target.checked; onChange((current) => ({ ...current, requirements: current.requirements.map((item) => item.id === requirement.id ? { ...item, checked } : item) })) }} />{requirement.name}</label>)}</div></section>
        <section><h3 className="text-sm font-bold text-slate-900">Actividad</h3><ol className="mt-3 space-y-3">{request.history.map((entry) => <li key={entry.id} className="flex gap-3"><span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700"><Check size={12} /></span><div><p className="text-sm font-medium text-slate-700">{entry.description}</p>{entry.note && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 [overflow-wrap:anywhere]">{entry.note}</p>}<p className="mt-1 text-xs text-slate-400">{formatDate(entry.date)}</p></div></li>)}</ol></section>
        {pendingAction && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4"><label className="block text-sm font-semibold text-slate-800" htmlFor="action-note">Motivo para {pendingAction === 'observar' ? 'observar' : 'rechazar'} la solicitud</label><textarea ref={noteRef} id="action-note" value={note} onChange={(event) => { setNote(event.target.value); setError('') }} className="mt-2 min-h-20 w-full rounded-lg border border-amber-200 bg-white p-3 text-base sm:text-sm outline-none focus:ring-2 focus:ring-teal-200" placeholder="Escribe el motivo" /><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => { setPendingAction(null); setError('') }} className="min-h-11 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600">Cancelar</button><button type="button" onClick={submitAction} className="min-h-11 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900">Confirmar</button></div></section>}
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      </div>
      <div className="border-t border-slate-100 px-5 py-4 sm:px-6"><p className="mb-3 text-xs text-slate-500">Estado actual: {statusLabels[request.status]}</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><button type="button" onClick={() => act('revisar')} className="min-h-11 rounded-lg bg-blue-600 px-2 py-2 text-sm font-semibold text-white hover:bg-blue-700">Revisar</button><button type="button" onClick={() => act('aprobar')} className="min-h-11 rounded-lg bg-emerald-600 px-2 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Aprobar</button><button type="button" onClick={() => act('observar')} className="min-h-11 rounded-lg bg-orange-500 px-2 py-2 text-sm font-semibold text-white hover:bg-orange-600">Observar</button><button type="button" onClick={() => act('rechazar')} className="min-h-11 rounded-lg bg-[#e60027] px-2 py-2 text-sm font-semibold text-white hover:bg-red-700">Rechazar</button></div></div>
    </aside>
  </div>
}
