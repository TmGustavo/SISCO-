import { Link } from 'react-router-dom'
import { statusLabels } from '../solicitudes/model.ts'
import type { Solicitud } from '../solicitudes/types.ts'
import type { Affiliate } from './types.ts'

export function AffiliateRequests({ requests, affiliates, onApprove }: { requests: Solicitud[]; affiliates: Affiliate[]; onApprove: (request: Solicitud) => void }) {
  const pending = requests.filter(request => {
    if (request.type !== 'afiliacion' || request.status === 'rechazada') return false
    const affiliate = affiliates.find(item => item.requestId === request.id && item.identity === request.identity)
    return request.status !== 'aprobada' || !affiliate || affiliate.status !== 'activo'
  })
  return <section className="rounded-lg bg-white p-3 shadow-sm" aria-labelledby="affiliate-requests-title"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 id="affiliate-requests-title" className="font-bold">Solicitudes de afiliación</h2><p className="mt-1 text-xs text-slate-500">Revisa los requisitos antes de aprobar. La aprobación activa la ficha vinculada o permite crearla.</p></div><Link to="/admin/solicitudes" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline">Ver solicitudes</Link></div>{pending.length === 0 ? <p className="py-4 text-sm text-slate-500">No hay solicitudes de afiliación por incorporar.</p> : <div className="mt-3 divide-y divide-slate-100">{pending.map(request => <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div className="min-w-0"><p className="break-words text-sm font-semibold">{request.name} · {request.identity}</p><p className="text-xs text-slate-500">{request.id} · {statusLabels[request.status]}</p></div><div className="flex flex-wrap gap-2"><Link to={`/admin/solicitudes?buscar=${encodeURIComponent(request.id)}`} className="inline-flex min-h-11 items-center rounded border border-slate-300 px-3 text-sm font-semibold text-blue-800">Revisar</Link><button type="button" onClick={() => onApprove(request)} className="min-h-11 rounded bg-emerald-700 px-3 text-sm font-semibold text-white">Aprobar afiliación</button></div></div>)}</div>}</section>
}
