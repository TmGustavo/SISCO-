import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserRound, X } from 'lucide-react'
import type { VehicleView } from '../vehicles/types.ts'
import { formatDate, localDate } from '../affiliates/model.ts'
import { statusLabels as requestStatusLabels } from '../solicitudes/model.ts'
import type { Solicitud } from '../solicitudes/types.ts'
import { useModalFocus } from '../solicitudes/useModalFocus.ts'
import { RelatedDocuments } from '../documents/RelatedDocuments.tsx'
import { availabilityLabels, statusLabels } from './model.ts'
import type { Driver } from './types.ts'

type Tab = 'informacion' | 'documentos' | 'vehiculo' | 'historial'
export function DriverDetail({ driver, request, vehicle, mobile, onClose, onEdit, onApprove }: { driver: Driver; request?: Solicitud; vehicle?: VehicleView; mobile?: boolean; onClose?: () => void; onEdit: () => void; onApprove: () => void }) {
  const [tab, setTab] = useState<Tab>('informacion')
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => onClose?.(), [onClose])
  useModalFocus(ref, close, mobile)
  const line = (label: string, value: string) => <div className="grid grid-cols-2 gap-2 py-1 text-sm"><dt className="text-slate-500">{label}</dt><dd className="break-words font-semibold">{value}</dd></div>
  return <div className={mobile ? 'fixed inset-0 z-[60] flex justify-end bg-slate-950/60' : ''} onMouseDown={e => { if (mobile && e.target === e.currentTarget) onClose?.() }}><div ref={ref} role={mobile ? 'dialog' : undefined} aria-modal={mobile || undefined} aria-label={mobile ? 'Ficha del conductor' : undefined} className={`${mobile ? 'h-full w-full max-w-md overflow-y-auto' : ''} rounded-lg bg-white p-4`}>
    <header className="flex items-center justify-between border-b pb-3"><h2 className="font-bold">Ficha del conductor</h2>{onClose && <button data-autofocus type="button" onClick={onClose} aria-label="Cerrar ficha" className="grid size-11 place-items-center"><X size={20} /></button>}</header><div className="flex items-center gap-3 py-4"><span className="grid size-14 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-900"><UserRound size={30} /></span><div className="min-w-0"><h3 className="break-words font-bold">{driver.name}</h3><p className="text-xs text-slate-500">DNI: {driver.identity} · {driver.phone}</p><p className="text-xs font-semibold text-blue-800">{statusLabels[driver.status]} · {availabilityLabels[driver.availability]}</p></div></div>
    <div className="grid grid-cols-4 gap-1" aria-label="Secciones de la ficha">{([['informacion', 'Información'], ['documentos', 'Documentos'], ['vehiculo', 'Vehículo'], ['historial', 'Historial']] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)} className={`min-h-11 rounded px-1 text-xs font-semibold ${tab === key ? 'bg-red-600 text-white' : 'bg-slate-100'}`}>{label}</button>)}</div>
    {tab === 'informacion' && <div className="mt-4 space-y-3"><dl>{line('Correo', driver.email)}{line('Dirección', driver.address)}{line('Licencia', `${driver.licenseNumber} · ${driver.licenseCategory}`)}{line('Emisión', formatDate(driver.licenseIssuedAt))}{line('Vencimiento', `${formatDate(driver.licenseExpiresAt)}${driver.licenseExpiresAt < localDate() ? ' · Vencida' : ''}`)}{line('Experiencia', `${driver.experienceYears} años`)}{line('Vehículo', driver.vehiclePlate || 'Sin asignar')}</dl><button type="button" onClick={onEdit} className="min-h-11 w-full rounded bg-blue-700 text-sm font-bold text-white">Editar ficha</button>{request && request.status !== 'aprobada' && request.status !== 'rechazada' && <button type="button" onClick={onApprove} className="min-h-11 w-full rounded bg-emerald-700 text-sm font-bold text-white">Aprobar postulación</button>}</div>}
    {tab === 'documentos' && <div className="mt-4 space-y-3 text-sm"><RelatedDocuments ownerType="conductor" ownerId={driver.id} />{request ? <><p>Solicitud {request.id} · {requestStatusLabels[request.status]}</p><Link to={`/admin/solicitudes?buscar=${encodeURIComponent(request.id)}`} className="inline-flex min-h-11 items-center text-blue-700 underline">Revisar solicitud y documentos</Link>{request.documents.map(doc => <div key={doc.id} className="rounded border border-slate-200 p-3"><p className="font-semibold">{doc.name}</p><p className="text-xs text-slate-500">{doc.received ? `Recibido${doc.fileName ? `: ${doc.fileName}` : ''}` : 'Pendiente'}</p>{doc.dataUrl?.startsWith('data:') && <a href={doc.dataUrl} download={doc.fileName || 'documento'} className="inline-flex min-h-11 items-center text-blue-700 underline">Descargar</a>}</div>)}</> : <p>No hay documentos de solicitud vinculados.</p>}</div>}
    {tab === 'vehiculo' && <div className="mt-4 text-sm">{vehicle ? <dl>{line('Placa', vehicle.info.plate)}{line('Marca / modelo', `${vehicle.info.brand} ${vehicle.info.model}`)}{line('Propietario', vehicle.owner)}{line('Color', vehicle.info.color)}</dl> : <p>{driver.vehiclePlate ? 'El vehículo asignado ya no figura en los registros disponibles.' : 'No hay vehículo asignado. Edita la ficha para asignar uno.'}</p>}</div>}
    {tab === 'historial' && <div className="mt-4 space-y-2">{driver.history.map(h => <div key={h.id} className="rounded border border-slate-200 p-3 text-sm">{h.description}<p className="mt-1 text-xs text-slate-500">{formatDate(h.date)}</p></div>)}</div>}
  </div></div>
}
