import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock3, FileWarning, Plus, Search, UserCheck, UserRoundX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { loadAffiliates, STORAGE_KEY as AFFILIATES_KEY } from '../affiliates/storage.ts'
import { normalize } from '../affiliates/model.ts'
import type { Affiliate } from '../affiliates/types.ts'
import { loadRequests, STORAGE_KEY as REQUESTS_KEY } from '../solicitudes/storage.ts'
import { statusLabels as requestStatusLabels } from '../solicitudes/model.ts'
import { SolicitudesLayout } from '../solicitudes/SolicitudesLayout.tsx'
import type { Solicitud } from '../solicitudes/types.ts'
import { fleet, isVehicleRecord } from '../vehicles/model.ts'
import { loadVehicles, VEHICLE_STORAGE_KEY } from '../vehicles/storage.ts'
import type { VehicleRecord } from '../vehicles/types.ts'
import { activeRental } from '../rentals/model.ts'
import { loadRentals, RENTAL_STORAGE_KEY } from '../rentals/storage.ts'
import type { Rental } from '../rentals/types.ts'
import { prepareDriverApproval, storeDriverApproval } from './approval.ts'
import { DriverDetail } from './DriverDetail.tsx'
import { DriverForm } from './DriverForm.tsx'
import { availabilityLabels, isDriver, saveDriver, statusLabels } from './model.ts'
import { DRIVER_STORAGE_KEY, loadDrivers, saveDrivers } from './storage.ts'
import type { Driver, DriverFormValues } from './types.ts'

const input = 'min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-blue-600'
export function AdminDriversPage() {
  const [initial] = useState(() => { try { return loadDrivers(window.localStorage) } catch { return loadDrivers({ getItem: () => { throw new Error() } }) } })
  const [drivers, setDrivers] = useState(initial.drivers)
  const [warning, setWarning] = useState(initial.warning)
  const [requests, setRequests] = useState<Solicitud[]>(() => { try { const loaded = loadRequests(window.localStorage); return loaded.warning ? [] : loaded.requests } catch { return [] } })
  const [affiliates, setAffiliates] = useState<Affiliate[]>(() => { try { const loaded = loadAffiliates(window.localStorage); return loaded.warning ? [] : loaded.affiliates } catch { return [] } })
  const [vehicleRecords, setVehicleRecords] = useState<VehicleRecord[]>(() => { try { const loaded = loadVehicles(window.localStorage); return loaded.warning ? [] : loaded.records } catch { return [] } })
  const [rentals, setRentals] = useState<Rental[]>(() => { try { const loaded = loadRentals(window.localStorage); return loaded.warning ? [] : loaded.rentals } catch { return [] } })
  const [selected, setSelected] = useState<string | null>(initial.drivers[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('todos')
  const [documents, setDocuments] = useState('todos')
  const [availability, setAvailability] = useState('todos')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<'new' | 'edit' | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const closeForm = useCallback(() => setForm(null), [])
  const closeDetail = useCallback(() => setDetailOpen(false), [])
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      try {
        if (event.key === DRIVER_STORAGE_KEY) { const parsed: unknown = JSON.parse(event.newValue ?? 'null'); if (!Array.isArray(parsed) || !parsed.every(isDriver)) throw new Error(); setDrivers(parsed); setSelected(id => parsed.some(d => d.id === id) ? id : parsed[0]?.id ?? null) }
        if (event.key === REQUESTS_KEY) { const loaded = loadRequests(window.localStorage); if (loaded.warning) throw new Error(); setRequests(loaded.requests) }
        if (event.key === AFFILIATES_KEY) { const loaded = loadAffiliates(window.localStorage); if (loaded.warning) throw new Error(); setAffiliates(loaded.affiliates) }
        if (event.key === VEHICLE_STORAGE_KEY) { const parsed: unknown = JSON.parse(event.newValue ?? 'null'); if (!Array.isArray(parsed) || !parsed.every(isVehicleRecord)) throw new Error(); setVehicleRecords(parsed) }
        if (event.key === RENTAL_STORAGE_KEY) { const loaded = loadRentals(window.localStorage); if (loaded.warning) throw new Error(); setRentals(loaded.rentals) }
      } catch { setWarning('No se pudo actualizar la información de otra pestaña. Recarga y revisa los datos.') }
    }
    window.addEventListener('storage', onStorage); return () => window.removeEventListener('storage', onStorage)
  }, [])
  const vehicles = fleet(vehicleRecords, affiliates)
  const requestFor = (driver: Driver) => requests.find(r => r.id === driver.requestId && r.type === 'conductores' && r.identity === driver.identity)
  const filtered = useMemo(() => drivers.filter(d => {
    const request = requestFor(d)
    const docs = request ? request.documents.every(doc => doc.received) ? 'completos' : 'pendientes' : 'sin_solicitud'
    return (!query.trim() || normalize(`${d.name} ${d.identity} ${d.phone} ${d.licenseNumber} ${d.vehiclePlate}`).includes(normalize(query))) && (status === 'todos' || d.status === status) && (availability === 'todos' || d.availability === availability) && (documents === 'todos' || docs === documents)
  }), [drivers, requests, query, status, documents, availability])
  const pages = Math.max(1, Math.ceil(filtered.length / 10))
  const visible = filtered.slice((Math.min(page, pages) - 1) * 10, Math.min(page, pages) * 10)
  const current = drivers.find(d => d.id === selected)
  const request = current ? requestFor(current) : undefined
  const vehicle = vehicles.find(v => v.info.plate === current?.vehiclePlate)
  const plates = [...new Set(vehicles.filter(v => (v.status === 'operacion' && !rentals.some(r => r.vehicleId === v.id && activeRental(r))) || v.info.plate === current?.vehiclePlate && form === 'edit').map(v => v.info.plate))]
  const persist = (next: Driver[]) => { try { const storage = window.localStorage; if (storage.getItem(DRIVER_STORAGE_KEY) !== null && loadDrivers(storage).warning) throw new Error('Los datos guardados no son válidos y no se sobrescribieron.'); if (!saveDrivers(storage, next)) throw new Error('No se pudo guardar la ficha en el navegador.'); setDrivers(next); setWarning(''); return '' } catch (error) { const message = error instanceof Error ? error.message : 'No se pudo guardar la ficha.'; setWarning(message); return message } }
  const save = (values: DriverFormValues) => { const changed = saveDriver(values, form === 'edit' ? current : undefined); const error = persist(form === 'edit' ? drivers.map(d => d.id === changed.id ? changed : d) : [changed, ...drivers]); if (error) return error; setSelected(changed.id); setForm(null); setRequestId(null); setQuery(''); setStatus('todos'); setDocuments('todos'); setAvailability('todos'); setPage(1); setNotice('Ficha de conductor guardada.') }
  const approve = () => {
    if (!current || !window.confirm(`¿Aprobar la postulación de ${current.name} y activar su ficha?`)) return
    try {
      const storage = window.localStorage
      const latestDrivers = storage.getItem(DRIVER_STORAGE_KEY) === null ? { drivers, warning: '' } : loadDrivers(storage)
      const latestRequests = storage.getItem(REQUESTS_KEY) === null ? { requests, warning: '' } : loadRequests(storage)
      const latestAffiliates = storage.getItem(AFFILIATES_KEY) === null ? { affiliates, warning: '' } : loadAffiliates(storage)
      const latestVehicles = storage.getItem(VEHICLE_STORAGE_KEY) === null ? { records: vehicleRecords, warning: '' } : loadVehicles(storage)
      if (latestDrivers.warning || latestRequests.warning || latestAffiliates.warning || latestVehicles.warning) throw new Error('No se pudieron leer los registros actuales. Revisa el almacenamiento.')
      const result = prepareDriverApproval(current.id, latestDrivers.drivers, latestRequests.requests, fleet(latestVehicles.records, latestAffiliates.affiliates).filter(v => v.status === 'operacion' || v.info.plate === current.vehiclePlate).map(v => v.info.plate))
      const error = storeDriverApproval(storage, result.drivers, result.requests)
      if (error) throw new Error(error)
      setDrivers(result.drivers); setRequests(result.requests); setNotice('Postulación aprobada y conductor activado.'); setWarning('')
    } catch (error) { setWarning(error instanceof Error ? error.message : 'No se pudo aprobar la postulación.') }
  }
  const select = (id: string) => { setSelected(id); setDetailOpen(true) }
  const edit = () => { setDetailOpen(false); setForm('edit') }
  const metrics = [{ label: 'Conductores activos', count: drivers.filter(d => d.status === 'activo').length, Icon: UserCheck, color: 'bg-emerald-600' }, { label: 'En proceso', count: drivers.filter(d => d.status === 'en_proceso').length, Icon: Clock3, color: 'bg-orange-500' }, { label: 'Con observaciones', count: drivers.filter(d => d.status === 'observado').length, Icon: FileWarning, color: 'bg-red-600' }, { label: 'Inactivos', count: drivers.filter(d => d.status === 'inactivo').length, Icon: UserRoundX, color: 'bg-slate-500' }]
  const driverRequests = requests.filter(r => r.type === 'conductores' && r.status !== 'rechazada')
  return <SolicitudesLayout active="Conductores"><section className="py-4"><div className="rounded-xl bg-[#092659] px-4 py-5 text-white sm:px-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold sm:text-3xl">Gestión de Conductores</h1><p className="mt-2 text-sm text-blue-100">Administra conductores, licencias, documentos y vehículos asignados.</p></div><button type="button" onClick={() => { setRequestId(null); setForm('new') }} className="flex min-h-11 items-center gap-2 rounded bg-red-600 px-4 text-sm font-bold text-white"><Plus size={19} /> Registrar conductor</button></div></div><p className="mt-3 text-xs text-slate-500">Datos de demostración almacenados en este navegador.</p>{warning && <p role="alert" className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-900">{warning}</p>}{notice && <p role="status" className="mt-3 rounded bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">{metrics.map(({ label, count, Icon, color }) => <div key={label} className="flex items-center gap-3 rounded-lg bg-white p-3"><span className={`grid size-11 shrink-0 place-items-center rounded-lg text-white ${color}`}><Icon size={22} /></span><div><p className="text-xs font-semibold">{label}</p><p className="text-xl font-bold">{count}</p></div></div>)}</div>
    <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_400px]"><div className="min-w-0 space-y-3"><div className="grid gap-2 rounded-lg bg-white p-3 sm:grid-cols-2 lg:grid-cols-4"><label className="relative"><span className="sr-only">Buscar conductor</span><Search size={18} className="absolute left-3 top-3 text-slate-500" /><input className={`${input} pl-10`} placeholder="Buscar nombre, DNI o licencia..." value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} /></label><label><span className="sr-only">Filtrar estado</span><select className={input} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}><option value="todos">Todos los estados</option><option value="activo">Activo</option><option value="en_proceso">En proceso</option><option value="observado">Con observación</option><option value="inactivo">Inactivo</option></select></label><label><span className="sr-only">Filtrar documentos</span><select className={input} value={documents} onChange={e => { setDocuments(e.target.value); setPage(1) }}><option value="todos">Todos los documentos</option><option value="completos">Completos</option><option value="pendientes">Pendientes</option><option value="sin_solicitud">Sin solicitud</option></select></label><label><span className="sr-only">Filtrar disponibilidad</span><select className={input} value={availability} onChange={e => { setAvailability(e.target.value); setPage(1) }}><option value="todos">Toda disponibilidad</option><option value="disponible">Disponible</option><option value="ocupado">Ocupado</option><option value="fuera_linea">Fuera de línea</option></select></label></div>
    <div className="rounded-lg bg-white p-3"><h2 className="font-bold">Lista de conductores ({filtered.length})</h2><div className="mt-3 hidden overflow-x-auto lg:block"><table className="w-full text-left text-xs"><thead className="bg-slate-100"><tr>{['Conductor', 'Disponibilidad', 'Vehículo', 'Licencia', 'Experiencia', 'Documentos', 'Estado', 'Acción'].map(label => <th key={label} className="px-2 py-3">{label}</th>)}</tr></thead><tbody>{visible.map(d => { const req = requestFor(d); return <tr key={d.id} className={`border-b border-slate-100 ${selected === d.id ? 'bg-blue-50' : ''}`}><td className="px-2 py-3 font-semibold">{d.name}<br /><span className="font-normal text-slate-500">DNI {d.identity}</span></td><td className="px-2 py-3">{availabilityLabels[d.availability]}</td><td className="px-2 py-3">{d.vehiclePlate || 'Sin asignar'}</td><td className="px-2 py-3">{d.licenseCategory}</td><td className="px-2 py-3">{d.experienceYears} años</td><td className="px-2 py-3">{req ? `${req.documents.filter(doc => doc.received).length}/${req.documents.length}` : '—'}</td><td className="px-2 py-3">{statusLabels[d.status]}</td><td><button type="button" onClick={() => select(d.id)} className="min-h-11 px-2 font-semibold text-blue-700" aria-label={`Ver ficha de ${d.name}`}>Ver</button></td></tr> })}</tbody></table></div><div className="mt-3 space-y-2 lg:hidden">{visible.map(d => <button type="button" key={d.id} onClick={() => select(d.id)} className="flex min-h-16 w-full items-center justify-between gap-2 rounded border border-slate-200 p-3 text-left"><span className="min-w-0"><span className="block break-words text-sm font-bold">{d.name}</span><span className="block text-xs text-slate-500">{d.identity} · {d.vehiclePlate || 'Sin vehículo'}</span></span><span className="text-right text-xs font-semibold text-blue-800">{statusLabels[d.status]}<span className="block text-slate-500">{availabilityLabels[d.availability]}</span></span></button>)}</div>{filtered.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No se encontraron conductores.</p>}<div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>Mostrando {filtered.length ? (Math.min(page, pages) - 1) * 10 + 1 : 0}–{Math.min(page * 10, filtered.length)} de {filtered.length}</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="min-h-11 rounded border px-3 disabled:opacity-40">Anterior</button><span>{Math.min(page, pages)} / {pages}</span><button type="button" disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="min-h-11 rounded border px-3 disabled:opacity-40">Siguiente</button></div></div></div>
    <section className="rounded-lg bg-white p-3"><h2 className="font-bold">Solicitudes de conductores</h2>{driverRequests.length === 0 ? <p className="mt-3 text-sm text-slate-500">No hay solicitudes disponibles.</p> : <div className="mt-2 divide-y divide-slate-100">{driverRequests.map(r => { const linked = drivers.find(d => d.requestId === r.id && d.identity === r.identity); return <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div className="min-w-0"><p className="break-words text-sm font-semibold">{r.name} · {r.identity}</p><p className="text-xs text-slate-500">{r.id} · {requestStatusLabels[r.status]}</p></div><div className="flex flex-wrap gap-2"><Link to={`/admin/solicitudes?buscar=${encodeURIComponent(r.id)}`} className="inline-flex min-h-11 items-center rounded border px-3 text-xs font-semibold text-blue-700">Revisar</Link><button type="button" onClick={() => { if (linked) select(linked.id); else { setRequestId(r.id); setForm('new') } }} className="min-h-11 rounded bg-blue-700 px-3 text-xs font-bold text-white">{linked ? 'Ver ficha' : 'Crear ficha'}</button></div></div> })}</div>}</section></div>
    <div className="hidden xl:block">{current ? <DriverDetail key={current.id} driver={current} request={request} vehicle={vehicle} onEdit={edit} onApprove={approve} /> : <p className="rounded bg-white p-4 text-sm">Selecciona un conductor.</p>}</div></div>
    {detailOpen && current && <div className="xl:hidden"><DriverDetail key={current.id} driver={current} request={request} vehicle={vehicle} mobile onClose={closeDetail} onEdit={edit} onApprove={approve} /></div>}{form && <DriverForm driver={form === 'edit' ? current : undefined} initialRequest={form === 'new' ? requests.find(r => r.id === requestId) : undefined} drivers={drivers} requests={requests} plates={plates} onClose={closeForm} onSave={save} />}
  </section></SolicitudesLayout>
}
