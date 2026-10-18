import { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleDollarSign, Clock3, Download, Eye, PauseCircle, Plus, Search, SlidersHorizontal, UsersRound } from 'lucide-react'
import { SolicitudesLayout } from '../solicitudes/SolicitudesLayout.tsx'
import { loadRequests, STORAGE_KEY as REQUESTS_KEY } from '../solicitudes/storage.ts'
import type { Solicitud } from '../solicitudes/types.ts'
import { loadDrivers } from '../drivers/storage.ts'
import { loadVehicles } from '../vehicles/storage.ts'
import { AffiliateDetail } from './AffiliateDetail.tsx'
import { AffiliateForm } from './AffiliateForm.tsx'
import { AffiliateRequests } from './AffiliateRequests.tsx'
import { prepareApproval, storeApproval } from './approval.ts'
import { addFee, changeStatus, debt, formatDate, isAffiliate, money, normalize, payFee, saveAffiliate, statusLabels, typeLabels } from './model.ts'
import { loadAffiliates, saveAffiliates, STORAGE_KEY } from './storage.ts'
import type { Affiliate, AffiliateFormValues, AffiliateStatus } from './types.ts'

const control = 'min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200'
const button = 'min-h-11 rounded-md px-4 text-sm font-bold'
function Badge({ affiliate }: { affiliate: Affiliate }) {
  const label = affiliate.status === 'activo' && debt(affiliate) > 0 ? 'Moroso' : statusLabels[affiliate.status]
  const color = affiliate.status === 'suspendido' || label === 'Moroso' ? 'bg-red-100 text-red-700' : affiliate.status === 'pendiente' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{label}</span>
}

export function AffiliatesPage() {
  const [initial] = useState(() => { try { return loadAffiliates(window.localStorage) } catch { return loadAffiliates({ getItem: () => { throw new Error() } }) } })
  const [affiliates, setAffiliates] = useState(initial.affiliates)
  const [warning, setWarning] = useState(initial.warning)
  const [requests, setRequests] = useState<Solicitud[]>(() => { try { const result = loadRequests(window.localStorage); return result.warning ? [] : result.requests } catch { return [] } })
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [status, setStatus] = useState('todos')
  const [debtFilter, setDebtFilter] = useState('todos')
  const [type, setType] = useState('todos')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string | null>(initial.affiliates[0]?.id ?? null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [form, setForm] = useState<'new' | 'edit' | 'approve' | null>(null)
  const [approvalId, setApprovalId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const closeForm = useCallback(() => setForm(null), [])
  const closeDetail = useCallback(() => setDetailOpen(false), [])
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === REQUESTS_KEY) { try { const result = loadRequests(window.localStorage); if (result.warning) throw new Error(); setRequests(result.requests) } catch { setRequests([]); setWarning('No se pudieron actualizar las solicitudes de otra pestaña.') } }
      if (event.key === STORAGE_KEY) {
        try {
          const parsed: unknown = JSON.parse(event.newValue ?? 'null')
          if (!Array.isArray(parsed) || !parsed.every(isAffiliate)) throw new Error()
          setAffiliates(parsed); setSelected(id => parsed.some(a => a.id === id) ? id : parsed[0]?.id ?? null); setWarning('')
        } catch { setWarning('Los datos locales cambiaron en otra pestaña y no se pudieron leer. Recarga para comprobarlos.') }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  const filtered = useMemo(() => {
    const term = normalize(query)
    return affiliates.filter(a => (!term || normalize(`${a.name} ${a.identity} ${a.phone} ${a.vehicle.plate} ${a.id}`).includes(term)) && (status === 'todos' || a.status === status) && (debtFilter === 'todos' || (debtFilter === 'moroso' ? debt(a) > 0 : debt(a) === 0)) && (type === 'todos' || a.type === type) && (!from || a.joinedAt >= from) && (!to || a.joinedAt <= to))
  }, [affiliates, query, status, debtFilter, type, from, to])
  const pages = Math.max(1, Math.ceil(filtered.length / 10))
  const visible = filtered.slice((Math.min(page, pages) - 1) * 10, Math.min(page, pages) * 10)
  const current = affiliates.find(a => a.id === selected)
  const request = requests.find(r => r.id === current?.requestId && r.type === 'afiliacion' && r.identity === current.identity)
  const persist = (next: Affiliate[]) => { try { if (window.localStorage.getItem(STORAGE_KEY) !== null && loadAffiliates(window.localStorage).warning) throw new Error('Los datos guardados no son válidos. No se sobrescribieron; revísalos antes de continuar.'); if (!saveAffiliates(window.localStorage, next)) throw new Error('No se pudieron guardar los cambios en el navegador.'); setAffiliates(next); setWarning(''); return '' } catch (error) { const message = error instanceof Error ? error.message : 'No se pudieron guardar los cambios en el navegador.'; setWarning(message); return message } }
  const update = (changed: Affiliate, message: string) => { const error = persist(affiliates.map(a => a.id === changed.id ? changed : a)); if (!error) setNotice(message); return error }
  const finishApproval = (id: string, values?: AffiliateFormValues) => {
    try {
      const storage = window.localStorage
      const latestAffiliates = storage.getItem(STORAGE_KEY) === null ? affiliates : loadAffiliates(storage)
      const latestRequests = storage.getItem(REQUESTS_KEY) === null ? requests : loadRequests(storage)
      if (!Array.isArray(latestAffiliates) && latestAffiliates.warning || !Array.isArray(latestRequests) && latestRequests.warning) throw new Error('No se pueden leer los registros actuales. Revisa el almacenamiento antes de aprobar.')
      const next = prepareApproval(id, Array.isArray(latestAffiliates) ? latestAffiliates : latestAffiliates.affiliates, Array.isArray(latestRequests) ? latestRequests : latestRequests.requests, values)
      const vehicles = loadVehicles(storage)
      if (vehicles.warning || vehicles.records.some(v => v.origin === 'propio' && v.ownInfo?.plate === next.affiliate.vehicle.plate)) throw new Error('No se puede aprobar: la flota no está disponible o la placa ya pertenece a un vehículo propio.')
      const error = storeApproval(storage, next.affiliates, next.requests)
      if (error) throw new Error(error)
      setAffiliates(next.affiliates); setRequests(next.requests); setSelected(next.affiliate.id); setWarning(''); setNotice('Solicitud aprobada y ficha de afiliado activada.'); setForm(null); setApprovalId(null); return ''
    } catch (error) { const message = error instanceof Error ? error.message : 'No se pudo aprobar la solicitud.'; setWarning(message); return message }
  }
  const approve = (item: Solicitud) => {
    const existing = affiliates.find(a => a.requestId === item.id || a.identity === item.identity)
    if (existing) { if (window.confirm(`¿Aprobar la solicitud de ${item.name} y activar su ficha existente?`)) finishApproval(item.id) }
    else { setApprovalId(item.id); setForm('approve') }
  }
  const save = (values: AffiliateFormValues) => { if (form === 'approve' && approvalId) return finishApproval(approvalId, values); try { const storedVehicles = loadVehicles(window.localStorage); const storedDrivers = loadDrivers(window.localStorage); if (storedVehicles.warning || storedDrivers.warning) throw new Error('No se pudieron leer la flota o los conductores.'); if (storedVehicles.records.some(v => v.origin === 'propio' && v.ownInfo?.plate === values.plate.toUpperCase())) throw new Error('Esta placa ya pertenece a un vehículo propio.'); if (form === 'edit' && current && current.vehicle.plate !== values.plate.toUpperCase() && storedDrivers.drivers.some(d => d.vehiclePlate === current.vehicle.plate)) throw new Error('Desasigna el conductor antes de cambiar la placa.'); const changed = saveAffiliate(values, form === 'edit' ? current : undefined); const error = persist(form === 'edit' ? affiliates.map(a => a.id === changed.id ? changed : a) : [changed, ...affiliates]); if (error) return error; setSelected(changed.id); setForm(null); setNotice(form === 'edit' ? 'Ficha actualizada.' : 'Afiliado registrado.'); setQuery(''); setStatus('todos'); setDebtFilter('todos'); setType('todos'); setFrom(''); setTo(''); setPage(1) } catch (error) { return error instanceof Error ? error.message : 'No se pudo guardar la ficha.' } }
  const select = (id: string) => { setSelected(id); setDetailOpen(true) }
  const edit = () => { setDetailOpen(false); setForm('edit') }
  const detailProps = current ? { affiliate: current, request, onEdit: edit, onStatus: (next: AffiliateStatus) => { update(changeStatus(current, next), 'Estado actualizado.') }, onPay: (id: string) => { update(payFee(current, id), 'Pago registrado en este navegador.') }, onAddFee: (period: string, dueDate: string, amount: number) => { try { return update(addFee(current, period, dueDate, amount), 'Cuota registrada.') } catch (error) { return error instanceof Error ? error.message : 'No se pudo registrar la cuota.' } } } : null
  const reset = () => { setQuery(''); setStatus('todos'); setDebtFilter('todos'); setType('todos'); setFrom(''); setTo(''); setPage(1) }
  const exportCsv = () => {
    const cell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? "'" : '') + value.replace(/"/g, '""')}"`
    const rows = [['Nombre', 'DNI', 'Teléfono', 'Correo', 'Placa', 'Ingreso', 'Tipo', 'Estado', 'Deuda'], ...filtered.map(a => [a.name, a.identity, a.phone, a.email, a.vehicle.plate, a.joinedAt, typeLabels[a.type], statusLabels[a.status], (debt(a) / 100).toFixed(2)])]
    const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'padron-afiliados.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const metrics = [{ label: 'Afiliados activos', value: affiliates.filter(a => a.status === 'activo').length, Icon: UsersRound, color: 'bg-[#09317b]' }, { label: 'Pendientes de aprobación', value: affiliates.filter(a => a.status === 'pendiente').length, Icon: Clock3, color: 'bg-orange-500' }, { label: 'Suspendidos', value: affiliates.filter(a => a.status === 'suspendido').length, Icon: PauseCircle, color: 'bg-red-600' }, { label: 'Afiliados morosos', value: affiliates.filter(a => debt(a) > 0).length, Icon: CircleDollarSign, color: 'bg-red-600' }]
  return <SolicitudesLayout active="Afiliados"><section className="py-3 sm:py-4">
    <div className="relative overflow-hidden rounded-xl bg-[#092659] px-4 py-5 text-white sm:px-8 sm:py-6"><div className="absolute inset-y-0 right-[-5%] hidden w-[34%] -skew-x-[30deg] bg-[#c70028] md:block" /><div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold sm:text-3xl">Padrón de Afiliados</h1><p className="mt-2 text-sm text-blue-50">Gestiona el registro de afiliados de Taxi Kaluz en Huancayo, Junín.<br className="hidden sm:block" /> Consulta su estado, pagos, documentos y más.</p></div><button type="button" onClick={() => setForm('new')} className={`${button} flex items-center justify-center gap-2 bg-[#e60027] text-white hover:bg-red-700`}><Plus size={19} /> Registrar afiliado</button></div></div>
    <p className="mt-3 text-xs text-slate-500">Datos y montos de demostración; los cambios se guardan únicamente en este navegador.</p>{warning && <p role="alert" className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-900">{warning}</p>}{notice && <p role="status" className="mt-3 rounded bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_350px]"><div className="min-w-0 space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{metrics.map(({ label, value, Icon, color }) => <div key={label} className="flex min-w-0 items-center gap-3 rounded-lg bg-white p-3 shadow-sm"><span className={`grid size-11 shrink-0 place-items-center rounded-lg text-white ${color}`}><Icon size={23} /></span><div className="min-w-0"><p className="text-xs font-semibold leading-4">{label}</p><p className="text-xl font-bold">{value}</p></div></div>)}</div>
      <div className="space-y-3 rounded-lg bg-white p-3 shadow-sm"><div className="flex gap-2"><label className="relative block min-w-0 flex-1"><span className="sr-only">Buscar afiliado</span><Search className="pointer-events-none absolute left-3 top-3 text-slate-500" size={18} /><input value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} placeholder="Buscar por nombre, DNI, teléfono o placa..." className={`${control} pl-10`} /></label><button type="button" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen} aria-controls="affiliate-filters" className="grid size-11 shrink-0 place-items-center rounded-md border border-slate-300 text-[#092657] sm:hidden" aria-label="Mostrar u ocultar filtros"><SlidersHorizontal size={19} /></button></div><div id="affiliate-filters" className={`${filtersOpen ? 'block' : 'hidden'} space-y-3 sm:block`}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><label className="text-xs font-semibold">Estado<select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className={`${control} mt-1`}><option value="todos">Todos</option><option value="activo">Activo</option><option value="pendiente">Pendiente</option><option value="suspendido">Suspendido</option></select></label><label className="text-xs font-semibold">Situación de deuda<select value={debtFilter} onChange={e => { setDebtFilter(e.target.value); setPage(1) }} className={`${control} mt-1`}><option value="todos">Todos</option><option value="moroso">Con deuda vencida</option><option value="aldia">Sin deuda vencida</option></select></label><label className="text-xs font-semibold">Tipo de afiliación<select value={type} onChange={e => { setType(e.target.value); setPage(1) }} className={`${control} mt-1`}><option value="todos">Todos</option><option value="propietario">Propietario</option><option value="alquilado">Alquilado</option></select></label><label className="text-xs font-semibold">Ingreso desde<input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} className={`${control} mt-1`} /></label><label className="text-xs font-semibold">Ingreso hasta<input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }} className={`${control} mt-1`} /></label></div><button type="button" onClick={reset} className={`${button} border border-slate-300 text-[#092657]`}>Limpiar filtros</button></div></div>
      <AffiliateRequests requests={requests} affiliates={affiliates} onApprove={approve} />
      <div className="rounded-lg bg-white p-3 shadow-sm"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-bold">Total de afiliados: {filtered.length}</h2><button type="button" onClick={exportCsv} className={`${button} flex items-center gap-2 border border-slate-300 text-[#092657]`}><Download size={17} /> Exportar CSV</button></div>
        <div className="hidden overflow-x-auto lg:block"><table className="w-full text-left text-xs"><thead className="bg-[#eef3f9] text-[#071b46]"><tr>{['#', 'Nombre completo', 'DNI', 'Teléfono', 'Vehículo (placa)', 'Ingreso', 'Cuota mensual', 'Estado', 'Deuda', 'Acciones'].map(h => <th key={h} className="px-2 py-3">{h}</th>)}</tr></thead><tbody>{visible.map((a, i) => <tr key={a.id} className={`border-b border-slate-100 ${selected === a.id ? 'bg-blue-50' : ''}`}><td className="px-2 py-2">{(Math.min(page, pages) - 1) * 10 + i + 1}</td><td className="px-2 py-2 font-semibold">{a.name}</td><td className="px-2 py-2">{a.identity}</td><td className="px-2 py-2">{a.phone}</td><td className="px-2 py-2">{a.vehicle.brand} {a.vehicle.model}<br />{a.vehicle.plate}</td><td className="whitespace-nowrap px-2 py-2">{formatDate(a.joinedAt)}</td><td className="whitespace-nowrap px-2 py-2">{money(a.monthlyFeeCents)}</td><td className="px-2 py-2"><Badge affiliate={a} /></td><td className={`whitespace-nowrap px-2 py-2 font-semibold ${debt(a) ? 'text-red-700' : 'text-emerald-700'}`}>{money(debt(a))}</td><td className="px-2 py-2"><button type="button" aria-label={`Ver ficha de ${a.name}`} onClick={() => select(a.id)} className="grid size-11 place-items-center rounded border border-slate-200 text-blue-800 hover:bg-blue-100"><Eye size={17} /></button></td></tr>)}</tbody></table></div>
        <div className="space-y-2 lg:hidden">{visible.map(a => <button key={a.id} type="button" onClick={() => select(a.id)} className="flex min-h-16 w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-blue-50"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-900"><UsersRound size={20} /></span><span className="min-w-0 flex-1"><span className="block break-words text-sm font-bold">{a.name}</span><span className="block text-xs text-slate-500">{a.identity} · {a.vehicle.plate}</span></span><span className="text-right"><Badge affiliate={a} /><span className={`mt-1 block text-xs ${debt(a) ? 'text-red-700' : 'text-emerald-700'}`}>{money(debt(a))}</span></span></button>)}</div>
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No se encontraron afiliados con estos filtros.</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>Mostrando {filtered.length ? (Math.min(page, pages) - 1) * 10 + 1 : 0}–{Math.min(page * 10, filtered.length)} de {filtered.length} afiliados</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="min-h-11 rounded border border-slate-200 px-3 disabled:opacity-40">Anterior</button><span>Página {Math.min(page, pages)} de {pages}</span><button type="button" disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="min-h-11 rounded border border-slate-200 px-3 disabled:opacity-40">Siguiente</button></div></div>
      </div></div><div className="hidden xl:block">{current && detailProps ? <AffiliateDetail key={current.id} {...detailProps} /> : <p className="rounded-lg bg-white p-4 text-sm">Selecciona un afiliado para ver su ficha.</p>}</div></div>
    {detailOpen && current && detailProps && <div className="xl:hidden"><AffiliateDetail key={current.id} {...detailProps} mobile onClose={closeDetail} /></div>}
    {form && <AffiliateForm affiliate={form === 'edit' ? current : undefined} initialRequest={form === 'approve' ? requests.find(item => item.id === approvalId) : undefined} affiliates={affiliates} requests={requests} onClose={closeForm} onSave={save} />}
  </section></SolicitudesLayout>
}
