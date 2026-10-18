import { useCallback, useEffect, useMemo, useState } from 'react'
import { BriefcaseBusiness, CarFront, CheckCircle2, ClipboardList, Clock3, FileClock, FolderOpen, Plus, Search, SlidersHorizontal, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { applyAction, createRequest, filterRequests, getStats, isRequest, statusLabels, typeLabels } from './model.ts'
import { RequestDetail } from './RequestDetail.tsx'
import { RequestForm } from './RequestForm.tsx'
import { SolicitudesLayout } from './SolicitudesLayout.tsx'
import { loadRequests, saveRequests, STORAGE_KEY } from './storage.ts'
import { requestStatuses, requestTypes } from './types.ts'
import type { RequestAction, RequestFormValues, RequestStatus, RequestType, Solicitud } from './types.ts'
import { displayId, formatDate, StatusBadge } from './ui.tsx'

const categoryIcons: Record<RequestType, LucideIcon> = { afiliacion: UsersRound, conductores: CarFront, alquileres: BriefcaseBusiness, turismo: FolderOpen }
const selectStyle = 'h-11 rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-600 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:text-sm'

export function SolicitudesPage() {
  const [initial] = useState(() => {
    try { return loadRequests(window.localStorage) } catch { return loadRequests({ getItem: () => { throw new Error('Storage unavailable') } }) }
  })
  const [requests, setRequests] = useState<Solicitud[]>(initial.requests)
  const [warning, setWarning] = useState(initial.warning)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<RequestType | 'todos'>('todos')
  const [status, setStatus] = useState<RequestStatus | 'todos'>('todos')
  const [selected, setSelected] = useState<string[]>([])
  const [detailId, setDetailId] = useState<string | null>(initial.requests[0]?.id ?? null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const closeDetail = useCallback(() => setDetailOpen(false), [])
  const closeForm = useCallback(() => setFormOpen(false), [])

  useEffect(() => {
    if (initial.warning && requests === initial.requests) return
    try {
      if (!saveRequests(window.localStorage, requests)) setWarning('No se pudieron guardar los cambios. Comprueba el espacio o los permisos de almacenamiento del navegador.')
      else setWarning('')
    } catch { setWarning('No se pudieron guardar los cambios. Comprueba los permisos de almacenamiento del navegador.') }
  }, [requests, initial])
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return
      try {
        if (event.storageArea !== window.localStorage || event.newValue === null) throw new Error('Datos locales eliminados')
        const incoming: unknown = JSON.parse(event.newValue)
        if (!Array.isArray(incoming) || !incoming.every(isRequest)) throw new Error('Datos locales inválidos')
        setRequests(incoming)
        setSelected((ids) => ids.filter((id) => incoming.some((item) => item.id === id)))
        setDetailId((id) => incoming.some((item) => item.id === id) ? id : incoming[0]?.id ?? null)
        setWarning('')
      } catch { setWarning('Los datos locales cambiaron en otra pestaña y no se pudieron leer. Recarga para comprobarlos.') }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  const stats = useMemo(() => getStats(requests), [requests])
  const filtered = useMemo(() => filterRequests(requests, query, type, status), [requests, query, type, status])
  const current = requests.find((item) => item.id === detailId)
  const allVisibleSelected = filtered.length > 0 && filtered.every((item) => selected.includes(item.id))
  const toggleSelected = (id: string) => setSelected((currentIds) => currentIds.includes(id) ? currentIds.filter((item) => item !== id) : [...currentIds, id])
  const toggleAllVisible = () => setSelected((currentIds) => allVisibleSelected ? currentIds.filter((id) => !filtered.some((item) => item.id === id)) : [...new Set([...currentIds, ...filtered.map((item) => item.id)])])
  function create(values: RequestFormValues) {
    const request = createRequest(values)
    setRequests((currentRequests) => [request, ...currentRequests])
    setDetailId(request.id)
    setType('todos'); setStatus('todos'); setQuery(''); setFormOpen(false); setNotice(`Se registró ${displayId(request.id)}.`)
  }
  function update(change: (request: Solicitud) => Solicitud) { setRequests((currentRequests) => currentRequests.map((item) => item.id === detailId ? change(item) : item)) }
  function openDetail(id: string) { setDetailId(id); setDetailOpen(true) }
  function performAction(action: RequestAction, note: string) {
    if (!detailId) return
    setRequests((currentRequests) => currentRequests.map((item) => item.id === detailId ? applyAction(item, action, note) : item))
    setNotice('El estado de la solicitud se actualizó.')
  }
  function reviewSelected() {
    setRequests((currentRequests) => currentRequests.map((item) => selected.includes(item.id) ? applyAction(item, 'revisar') : item))
    setNotice(`${selected.length} ${selected.length === 1 ? 'solicitud enviada' : 'solicitudes enviadas'} a revisión.`)
    setSelected([])
  }

  const metrics = [
    { label: 'Pendientes', value: stats.pending, detail: 'Por revisar', icon: Clock3, color: 'bg-amber-50 text-amber-600' },
    { label: 'En revisión', value: stats.review, detail: 'En proceso de evaluación', icon: FileClock, color: 'bg-blue-50 text-blue-600' },
    { label: 'Aprobadas', value: stats.approved, detail: 'Solicitudes aprobadas', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Observadas', value: requests.filter((item) => item.status === 'observada').length, detail: 'Requieren atención', icon: ClipboardList, color: 'bg-red-50 text-red-600' },
  ]

  return <SolicitudesLayout><section className="py-3 sm:py-4">
    <div className="relative overflow-clip rounded-xl bg-[#092659] px-4 py-4 text-white sm:px-8 sm:py-6"><div className="absolute inset-y-0 right-[-5%] hidden w-[36%] -skew-x-[30deg] bg-[#c70028] md:block" /><div className="relative flex flex-row items-center justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Solicitudes</h1><p className="mt-2 hidden max-w-2xl text-sm leading-6 text-blue-50 sm:block sm:text-base">Gestiona todas las solicitudes de afiliación, conductores, alquileres y reservas de turismo. Revisa documentos, valida requisitos y da seguimiento a cada trámite.</p></div><button type="button" onClick={() => setFormOpen(true)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-center rounded-lg bg-white px-3 py-2.5 text-xs font-bold sm:px-4 sm:py-3 sm:text-sm text-[#b90024] shadow-sm hover:bg-red-50 sm:self-center"><Plus size={18} /> Nueva solicitud</button></div></div>
    {warning && <div role="alert" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{warning}</div>}
    {notice && <div role="status" className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso" className="text-teal-700">×</button></div>}
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 xl:grid-cols-5"><button type="button" onClick={() => setType('todos')} aria-pressed={type === 'todos'} className={`flex min-w-[145px] shrink-0 items-center gap-3 rounded-lg border p-3 text-left sm:min-w-0 ${type === 'todos' ? 'border-[#e60027] bg-[#e60027] text-white' : 'border-slate-200 bg-white text-[#102f6b]'}`}><ClipboardList size={25} /><span><span className="block text-xs font-semibold">Todas las solicitudes</span><span className="text-xl font-bold">{stats.total}</span></span></button>{requestTypes.map((category) => { const Icon = categoryIcons[category]; return <button key={category} type="button" onClick={() => setType(category)} aria-pressed={type === category} className={`flex min-w-[145px] shrink-0 items-center gap-3 rounded-lg border p-3 text-left sm:min-w-0 transition ${type === category ? 'border-[#e60027] bg-[#e60027] text-white' : 'border-slate-200 bg-white text-[#102f6b] hover:border-blue-300'}`}><Icon size={25} /><span><span className="block text-xs font-semibold">{typeLabels[category]}</span><span className="text-xl font-bold">{stats.byType[category]}</span></span></button> })}</div>
    <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">{metrics.map(({ label, value, detail, icon: Icon, color }) => <article key={label} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"><span className={`rounded-lg p-2.5 ${color}`}><Icon size={21} /></span><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="text-xl font-bold text-[#071b46]">{value} <span className="ml-1 text-xs font-normal text-slate-400">{stats.total ? Math.round(value / stats.total * 100) : 0}%</span></p><span className="sr-only">{detail}</span></div></article>)}</div>
    <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.65fr)]"><div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5"><div><h2 className="text-lg font-bold text-[#071b46]">Bandeja de solicitudes</h2><p className="mt-1 text-sm text-slate-500">Consulta, revisa y actualiza cada solicitud.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}</span></div>
      <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row"><label className="relative min-w-0 flex-1"><Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" /><span className="sr-only">Buscar solicitudes</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, documento o código..." className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-base outline-none sm:text-sm placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></label><div className="flex flex-col gap-3 min-[420px]:flex-row"><label className="min-w-0 flex-1"><span className="sr-only">Filtrar por tipo</span><select value={type} onChange={(event) => setType(event.target.value as RequestType | 'todos')} className={`${selectStyle} w-full`}><option value="todos">Tipo: todos</option>{requestTypes.map((item) => <option key={item} value={item}>{typeLabels[item]}</option>)}</select></label><label className="min-w-0 flex-1"><span className="sr-only">Filtrar por estado</span><select value={status} onChange={(event) => setStatus(event.target.value as RequestStatus | 'todos')} className={`${selectStyle} w-full`}><option value="todos">Estado: todos</option>{requestStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></label></div></div>
      {selected.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-teal-100 bg-teal-50 px-5 py-3 text-sm text-teal-900"><span>{selected.length} {selected.length === 1 ? 'solicitud seleccionada' : 'solicitudes seleccionadas'}</span><div className="flex gap-3"><button type="button" onClick={() => setSelected([])} className="font-semibold text-teal-700 hover:underline">Limpiar selección</button><button type="button" onClick={reviewSelected} className="min-h-11 rounded-md bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800">Enviar a revisión</button></div></div>}
      {filtered.length === 0 ? <div className="border-t border-slate-100 px-5 py-14 text-center"><SlidersHorizontal className="mx-auto text-slate-300" size={28} /><p className="mt-3 font-semibold text-slate-700">No encontramos solicitudes</p><p className="mt-1 text-sm text-slate-500">Prueba otra búsqueda o cambia los filtros.</p><button type="button" onClick={() => { setQuery(''); setType('todos'); setStatus('todos') }} className="mt-3 text-sm font-semibold text-teal-700 hover:underline">Limpiar filtros</button></div> : <>
        <div className="hidden overflow-x-auto lg:block"><table className="w-full text-left text-sm"><thead className="border-y border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500"><tr><th scope="col" className="w-12 px-5 py-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Seleccionar solicitudes visibles" className="size-4 accent-teal-700" /></th><th scope="col" className="px-3 py-3 font-semibold">Solicitante</th><th scope="col" className="px-3 py-3 font-semibold">Tipo</th><th scope="col" className="px-3 py-3 font-semibold">Fecha</th><th scope="col" className="px-3 py-3 font-semibold">Estado</th><th scope="col" className="px-5 py-3 text-right font-semibold">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((item) => <tr key={item.id} className={item.id === detailId ? 'bg-blue-50/70' : 'hover:bg-slate-50/60'}><td className="px-5 py-4"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelected(item.id)} aria-label={`Seleccionar solicitud de ${item.name}`} className="size-4 accent-teal-700" /></td><td className="px-3 py-4"><p className="break-words [overflow-wrap:anywhere] font-semibold text-slate-800">{item.name}</p><p className="mt-1 text-xs text-slate-400">{displayId(item.id)} · {item.identity}</p></td><td className="whitespace-nowrap px-3 py-4 text-slate-600">{typeLabels[item.type]}</td><td className="whitespace-nowrap px-3 py-4 text-slate-500">{formatDate(item.createdAt)}</td><td className="px-3 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => openDetail(item.id)} aria-label={`Ver detalle de ${item.name}`} className="whitespace-nowrap font-semibold text-teal-700 hover:text-teal-900 hover:underline">Ver detalle</button></td></tr>)}</tbody></table></div>
        <div className="divide-y divide-slate-100 border-t border-slate-100 lg:hidden"><div className="px-5 py-3"><label className="flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-500"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="size-4 accent-teal-700" /> Seleccionar visibles</label></div>{filtered.map((item) => <article key={item.id} className="px-5 py-4"><div className="flex items-start gap-3"><label className="-ml-2 -mt-2 flex size-11 shrink-0 items-center justify-center"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelected(item.id)} aria-label={`Seleccionar solicitud de ${item.name}`} className="size-5 accent-teal-700" /></label><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="break-words [overflow-wrap:anywhere] font-semibold text-slate-800">{item.name}</p><p className="mt-1 text-xs text-slate-400">{displayId(item.id)} · {formatDate(item.createdAt)}</p></div><StatusBadge status={item.status} /></div><div className="mt-3 flex items-center justify-between gap-2"><span className="text-sm text-slate-500">{typeLabels[item.type]}</span><button type="button" onClick={() => openDetail(item.id)} aria-label={`Ver detalle de ${item.name}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-700">Ver detalle</button></div></div></div></article>)}</div>
      </>}
      <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Mostrando {filtered.length} de {requests.length} solicitudes</div>
    </div><div className="hidden xl:block">{current ? <RequestDetail key={current.id} request={current} onClose={closeDetail} onChange={update} onAction={performAction} embedded /> : <div className="rounded-xl bg-white p-6 text-sm text-slate-500">Selecciona una solicitud para ver el detalle.</div>}</div></div>
    {formOpen && <RequestForm onClose={closeForm} onCreate={create} />}
    {current && detailOpen && <div className="xl:hidden"><RequestDetail key={current.id} request={current} onClose={closeDetail} onChange={update} onAction={performAction} /></div>}
  </section></SolicitudesLayout>
}
