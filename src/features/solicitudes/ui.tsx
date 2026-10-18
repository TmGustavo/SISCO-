import { statusLabels } from './model.ts'
import type { RequestStatus } from './types.ts'

const statusStyles: Record<RequestStatus, string> = {
  pendiente: 'bg-amber-50 text-amber-700', en_revision: 'bg-blue-50 text-blue-700', aprobada: 'bg-emerald-50 text-emerald-700', observada: 'bg-orange-50 text-orange-700', rechazada: 'bg-rose-50 text-rose-700',
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}><span className="size-1.5 rounded-full bg-current" />{statusLabels[status]}</span>
}

export function formatDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function displayId(id: string) { return id.startsWith('SOL-') ? id : `SOL-${id.slice(0, 8).toUpperCase()}` }
