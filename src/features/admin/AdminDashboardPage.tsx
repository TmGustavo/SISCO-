import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, AlertTriangle, ArrowRight, BadgeCheck, BellRing, CarFront,
  CheckCheck, ChevronRight, CircleAlert, ClipboardList, Clock3,
  FileText, MapPin, MapPinned, ShieldCheck,
  TrendingUp, UserRound, UsersRound, Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatDate, money } from '../affiliates/model.ts'
import { loadAffiliates } from '../affiliates/storage.ts'
import { documentLabels, documentState } from '../documents/model.ts'
import { loadDocuments } from '../documents/storage.ts'
import { loadDrivers } from '../drivers/storage.ts'
import { loadRentals } from '../rentals/storage.ts'
import { statusLabels as requestStatusLabels, typeLabels as requestTypeLabels } from '../solicitudes/model.ts'
import { SolicitudesLayout } from '../solicitudes/SolicitudesLayout.tsx'
import { loadRequests } from '../solicitudes/storage.ts'
import { fleet } from '../vehicles/model.ts'
import { loadVehicles } from '../vehicles/storage.ts'
import { dashboardPayments, dashboardStats, monthlyTotals } from './dashboardModel.ts'
import type { DashboardData } from './dashboardModel.ts'

function readDashboard(): { data: DashboardData; warning: string } {
  try {
    const storage = window.localStorage
    const affiliates = loadAffiliates(storage)
    const drivers = loadDrivers(storage)
    const records = loadVehicles(storage)
    const documents = loadDocuments(storage)
    const requests = loadRequests(storage)
    const rentals = loadRentals(storage)
    const warning = [affiliates.warning, drivers.warning, records.warning, documents.warning, requests.warning, rentals.warning].filter(Boolean).join(' ')
    const affiliateData = affiliates.warning ? [] : affiliates.affiliates
    return { data: {
      affiliates: affiliateData,
      drivers: drivers.warning ? [] : drivers.drivers,
      vehicles: records.warning || affiliates.warning ? [] : fleet(records.records, affiliateData),
      documents: documents.warning ? [] : documents.documents,
      requests: requests.warning ? [] : requests.requests,
      rentals: rentals.warning ? [] : rentals.rentals,
    }, warning }
  } catch {
    return { data: { affiliates: [], drivers: [], vehicles: [], documents: [], requests: [], rentals: [] }, warning: 'No se pudo acceder al almacenamiento local.' }
  }
}

const moneyShort = (cents: number) => money(cents)
const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const card = 'rounded-[16px] border border-slate-200/70 bg-white shadow-[0_5px_22px_rgba(17,45,94,.055)]'

function SectionHeader({ icon: Icon, label, href, action = 'Ver todos' }: { icon: LucideIcon; label: string; href?: string; action?: string }) {
  return <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
    <div className="flex min-w-0 items-center gap-2"><Icon size={18} className="shrink-0 text-[#1243a0]"/><h2 className="truncate text-[13px] font-extrabold text-[#0b275d]">{label}</h2></div>
    {href && <Link to={href} className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-blue-700 hover:underline">{action}<ArrowRight size={13}/></Link>}
  </div>
}

function Kpi({ label, value, icon: Icon, to, color, note }: { label: string; value: number | string; icon: LucideIcon; to: string; color: string; note: string }) {
  return <Link to={to} className={`group ${card} flex min-h-[106px] items-center gap-3 p-3.5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg`}>
    <span className={`grid size-12 shrink-0 place-items-center rounded-[13px] text-white shadow-md ${color}`}><Icon size={23} strokeWidth={2.3}/></span>
    <span className="min-w-0"><span className="block text-[11px] font-bold leading-tight text-[#153267]">{label}</span><span className="mt-1 block text-[25px] font-black leading-none tracking-tight text-[#0a2251]">{value}</span><span className="mt-1.5 block truncate text-[10px] text-slate-500">{note}</span></span>
  </Link>
}

function MapPreview({ operating }: { operating: number }) {
  return <section className={`${card} flex min-h-[315px] flex-col overflow-hidden`}>
    <SectionHeader icon={MapPinned} label="GPS · Vista de la zona" href="/admin/gps" action="Ver módulo GPS"/>
    <div className="relative min-h-[225px] flex-1 overflow-hidden bg-[#cfe6dc]">
      <svg viewBox="0 0 680 320" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect width="680" height="320" fill="#d9e8cf"/>
        <path d="M0 70 Q165 30 285 100 T680 58 L680 0H0Z" fill="#bbdcb6"/>
        <path d="M0 240 Q160 170 300 255 T680 220 L680 320H0Z" fill="#b3d6b4"/>
        <path d="M-15 293 Q180 237 330 163 T700 35" stroke="#8dcde1" strokeWidth="21" fill="none" opacity=".85"/>
        <g stroke="#fdfcf2" fill="none" strokeLinecap="round">
          <path d="M-10 115 Q240 107 680 267" strokeWidth="18"/>
          <path d="M44 -10 Q105 140 220 342" strokeWidth="15"/>
          <path d="M390 -20 Q310 130 560 336" strokeWidth="16"/>
          <path d="M-20 277 Q170 155 690 95" strokeWidth="18"/>
          <path d="M280 0 Q270 160 400 320" strokeWidth="13"/>
        </g>
        <g stroke="#d8c9a7" fill="none" strokeWidth="2">
          <path d="M-10 115 Q240 107 680 267"/><path d="M44 -10 Q105 140 220 342"/><path d="M390 -20 Q310 130 560 336"/><path d="M-20 277 Q170 155 690 95"/>
        </g>
        <g fill="#426d5a" fontSize="15" fontFamily="Arial, sans-serif" fontWeight="bold">
          <text x="170" y="145">EL TAMBO</text><text x="360" y="196" fontSize="22" fill="#243d4e">HUANCAYO</text><text x="505" y="74">CHILCA</text><text x="50" y="270">SAPALLANGA</text>
        </g>
        <g fill="#ffffff" stroke="#1d66c1" strokeWidth="5"><circle cx="250" cy="90" r="12"/><circle cx="390" cy="138" r="12"/><circle cx="540" cy="231" r="12"/></g>
        <g fill="#1267b6"><circle cx="250" cy="90" r="5"/><circle cx="390" cy="138" r="5"/><circle cx="540" cy="231" r="5"/></g>
      </svg>
      <div className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-[#10335c] shadow-sm">Huancayo · Junín</div>
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/95 px-3 py-2 shadow-sm"><span className="text-[10px] font-bold text-slate-600">Mapa referencial, no GPS en vivo</span><Link to="/admin/vehiculos" className="text-[10px] font-bold text-blue-700">{operating} en operación <ChevronRight size={12} className="inline"/></Link></div>
    </div>
  </section>
}

export function AdminDashboardPage() {
  const [snapshot, setSnapshot] = useState(readDashboard)
  const [year, setYear] = useState(new Date().getFullYear())
  useEffect(() => {
    const refresh = () => setSnapshot(readDashboard())
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh) }
  }, [])
  const { data } = snapshot
  const stats = dashboardStats(data)
  const payments = dashboardPayments(data)
  const monthly = monthlyTotals(payments, year)
  const maximum = Math.max(...monthly, 1)
  const monthTotal = year === new Date().getFullYear() ? monthly[new Date().getMonth()] : 0
  const annualPayments = payments.filter(p => new Date(p.date).getFullYear() === year)
  const feeSum = annualPayments.filter(p => p.type === 'cuotas').reduce((s, p) => s + p.cents, 0)
  const rentalSum = annualPayments.filter(p => p.type === 'alquileres').reduce((s, p) => s + p.cents, 0)
  const total = feeSum + rentalSum
  const metrics = [
    { label: 'Afiliados activos', value: stats.activeAffiliates, icon: UsersRound, color: 'bg-[#0864df]', to: '/admin/afiliados', note: `${data.affiliates.length} afiliados registrados` },
    { label: 'Conductores activos', value: stats.activeDrivers, icon: UserRound, color: 'bg-[#ed1239]', to: '/admin/conductores', note: `${data.drivers.length} conductores registrados` },
    { label: 'Vehículos operativos', value: stats.operatingVehicles, icon: CarFront, color: 'bg-[#0a4ca9]', to: '/admin/vehiculos', note: `${data.vehicles.length} en la flota` },
    { label: 'Cuotas pendientes', value: stats.pendingFees, icon: Clock3, color: 'bg-[#fa8b0b]', to: '/admin/pagos', note: `${moneyShort(stats.debt)} por cobrar` },
    { label: 'Solicitudes nuevas', value: stats.newRequests, icon: ClipboardList, color: 'bg-[#6941d8]', to: '/admin/solicitudes', note: 'Pendientes de revisión' },
    { label: 'Docs. por vencer', value: stats.expiringDocuments, icon: AlertTriangle, color: 'bg-[#f42b42]', to: '/admin/documentos', note: `${stats.overdueDocuments} ya vencidos` },
  ]
  const recentRequests = [...data.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  const dueDocuments = data.documents.filter(d => documentState(d) !== 'vigente').sort((a, b) => a.expiresAt.localeCompare(b.expiresAt)).slice(0, 6)
  const activity = [
    ...data.affiliates.flatMap(a => a.history.map(h => ({ ...h, who: a.name }))),
    ...data.drivers.flatMap(d => d.history.map(h => ({ ...h, who: d.name }))),
    ...data.vehicles.flatMap(v => v.history.map(h => ({ ...h, who: v.info.plate }))),
    ...data.rentals.flatMap(r => r.history.map(h => ({ ...h, who: r.client }))),
    ...data.requests.flatMap(r => r.history.map(h => ({ ...h, who: r.name }))),
    ...data.documents.map(d => ({ id: d.id, date: d.createdAt, description: `Documento: ${documentLabels[d.type]}`, who: d.fileName })),
  ].sort((a,b)=>b.date.localeCompare(a.date)).slice(0, 6)
  const operating = data.vehicles.filter(v => v.status === 'operacion').length
  const maintenance = data.vehicles.filter(v => v.status === 'mantenimiento').length
  const others = Math.max(0,data.vehicles.length - operating - maintenance)
  const opPercentage = data.vehicles.length ? operating / data.vehicles.length * 100 : 0
  const maintenancePercentage = data.vehicles.length ? maintenance / data.vehicles.length * 100 : 0
  const quickActions: { label: string; to: string; icon: LucideIcon; color: string }[] = [
    { label: 'Registrar afiliado', to: '/admin/afiliados', icon: UsersRound, color: 'bg-[#1165df]' },
    { label: 'Registrar conductor', to: '/admin/conductores', icon: UserRound, color: 'bg-[#e90035]' },
    { label: 'Revisar solicitudes', to: '/admin/solicitudes', icon: BadgeCheck, color: 'bg-[#0c3679]' },
    { label: 'Subir documento', to: '/admin/documentos', icon: FileText, color: 'bg-white text-[#133a79] border border-slate-200' },
    { label: 'Ver mapa / GPS', to: '/admin/gps', icon: MapPin, color: 'bg-white text-[#133a79] border border-slate-200' },
  ]

  return <SolicitudesLayout active="Dashboard"><section className="space-y-3 pb-4 pt-4 sm:space-y-4">
    <div className="relative isolate overflow-hidden rounded-[18px] bg-[#071b49] px-5 py-7 text-white shadow-[0_10px_28px_rgba(8,27,73,.12)] sm:px-8 lg:px-9">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#071b49] via-[#102f70] to-[#071a40]" />
      <div className="pointer-events-none absolute -right-12 -top-16 h-60 w-[47%] -skew-x-[25deg] bg-[#dc0b36]/95 opacity-90" />
      <div className="pointer-events-none absolute right-[16%] top-0 h-full w-28 -skew-x-[25deg] opacity-35" style={{backgroundImage:'conic-gradient(#fff 25%, transparent 0 50%, #fff 0 75%, transparent 0)',backgroundSize:'30px 30px'}} />
      <div className="relative flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 text-[10px] font-black uppercase tracking-[.24em] text-blue-200">Centro de control administrativo</p><h1 className="text-[27px] font-black tracking-tight sm:text-[34px]">¡Bienvenido, <span className="text-white">Admin!</span></h1><p className="mt-1 max-w-[620px] text-sm leading-6 text-blue-100">Gestiona afiliaciones, conductores, vehículos, pagos y solicitudes de Taxi Kaluz desde un solo lugar.</p></div><div className="hidden items-center gap-3 rounded-xl border border-white/20 bg-[#061a41]/50 px-4 py-3 backdrop-blur-sm lg:flex"><ShieldCheck size={25} className="text-amber-300"/><div><p className="text-xs font-extrabold">Control centralizado</p><p className="text-[11px] text-blue-200">Huancayo · Región Junín</p></div></div></div>
    </div>
    <p className="px-1 text-[11px] font-medium text-slate-500">Indicadores calculados con registros de demostración del navegador; no representan cifras verificadas de la empresa.</p>
    {snapshot.warning && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{snapshot.warning}</p>}
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">{metrics.map(m=><Kpi key={m.to} {...m}/>)}</div>

    <section className={`${card} flex flex-wrap items-center gap-2 p-3 sm:px-4`}><div className="mr-2 flex items-center gap-2 px-1 text-[13px] font-black text-[#102a62]"><TrendingUp size={20} className="text-[#0d47a1]"/>Acciones rápidas</div><div className="flex flex-1 flex-wrap gap-2">{quickActions.map(({label,to,icon:Icon,color})=><Link key={to} to={to} className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:text-xs ${color} ${color.includes('text-[')?'':'text-white'}`}><Icon size={16}/>{label}</Link>)}</div></section>

    <div className="grid gap-3 lg:grid-cols-12">
      <section className={`${card} overflow-hidden lg:col-span-4`}><SectionHeader icon={ClipboardList} label="Solicitudes recientes" href="/admin/solicitudes"/><div className="divide-y divide-slate-100 px-3">{recentRequests.map(r=><Link key={r.id} to={`/admin/solicitudes?buscar=${encodeURIComponent(r.id)}`} className="group flex min-h-[53px] items-center gap-3 px-1 py-2.5 hover:bg-blue-50"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700"><UserRound size={17}/></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-[#172d55]">{r.name || 'Sin nombre'}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{requestTypeLabels[r.type]} · {r.id}</span></span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${r.status==='pendiente'?'bg-amber-100 text-amber-700':r.status==='aprobada'?'bg-emerald-100 text-emerald-700':'bg-blue-100 text-blue-700'}`}>{requestStatusLabels[r.status]}</span><ChevronRight size={14} className="text-slate-400 group-hover:text-blue-700"/></Link>)}{!recentRequests.length && <p className="py-8 text-center text-xs text-slate-500">Sin solicitudes recientes.</p>}</div></section>
      <div className="lg:col-span-5"><MapPreview operating={operating}/></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1">
        <section className={`${card} overflow-hidden`}><SectionHeader icon={CarFront} label="Vehículos · Estado general" href="/admin/vehiculos"/><div className="flex items-center justify-around gap-2 p-4"><div className="grid size-[115px] shrink-0 place-items-center rounded-full" style={{background: `conic-gradient(#05a65e 0% ${opPercentage}%, #f6aa18 ${opPercentage}% ${opPercentage+maintenancePercentage}%, #e63b4d ${opPercentage+maintenancePercentage}% 100%)`}}><div className="grid size-[83px] place-items-center rounded-full bg-white text-center"><span><strong className="block text-2xl leading-none text-[#0b285b]">{data.vehicles.length}</strong><span className="text-[9px] font-semibold text-slate-500">Vehículos</span></span></div></div><div className="space-y-2.5 text-[11px]"><div><span className="mr-1.5 inline-block size-2 rounded-full bg-emerald-500"/>En servicio <strong>{operating}</strong></div><div><span className="mr-1.5 inline-block size-2 rounded-full bg-amber-400"/>Mantenimiento <strong>{maintenance}</strong></div><div><span className="mr-1.5 inline-block size-2 rounded-full bg-rose-500"/>Otros <strong>{others}</strong></div></div></div></section>
        <section className={`${card} overflow-hidden`}><SectionHeader icon={Wallet} label="Ingresos y pagos" href="/admin/pagos" action="Ver detalles"/><div className="px-4 pb-4 pt-2"><p className="text-[26px] font-black tracking-tight text-[#0a285f]">{moneyShort(total)}</p><p className="text-[11px] text-slate-500">Recaudación registrada en {year}</p><div className="mt-3 flex h-[52px] items-end gap-1">{monthly.map((v,i)=><span key={i} className={`flex-1 rounded-t-sm ${i===new Date().getMonth()&&year===new Date().getFullYear()?'bg-[#0c3fa9]':'bg-[#73a7ed]'}`} title={`${monthNames[i]}: ${moneyShort(v)}`} style={{height:`${Math.max(6,v/maximum*100)}%`}}/>)}</div></div></section>
      </div>
    </div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <section className={`${card} overflow-hidden`}><SectionHeader icon={UsersRound} label="Afiliados" href="/admin/afiliados"/><div className="flex items-center gap-3 px-4 pt-5"><span className="grid size-12 place-items-center rounded-full bg-blue-100 text-blue-700"><UsersRound size={24}/></span><div><p className="text-3xl font-black leading-none">{data.affiliates.length}</p><p className="mt-1 text-[11px] text-slate-500">Afiliados registrados</p></div></div><div className="mx-4 mt-4 space-y-2.5 border-t border-slate-100 py-4 text-xs"><div className="flex justify-between"><span>Activos</span><strong className="text-emerald-600">{stats.activeAffiliates}</strong></div><div className="flex justify-between"><span>En trámite / suspendidos</span><strong>{data.affiliates.length-stats.activeAffiliates}</strong></div></div><Link to="/admin/afiliados" className="mx-4 mb-4 flex min-h-9 items-center justify-center rounded-lg border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-50">Gestionar afiliados <ArrowRight size={14} className="ml-2"/></Link></section>
      <section className={`${card} overflow-hidden`}><SectionHeader icon={UserRound} label="Conductores" href="/admin/conductores"/><div className="flex items-center gap-3 px-4 pt-5"><span className="grid size-12 place-items-center rounded-full bg-rose-100 text-rose-600"><UserRound size={24}/></span><div><p className="text-3xl font-black leading-none">{data.drivers.length}</p><p className="mt-1 text-[11px] text-slate-500">Conductores registrados</p></div></div><div className="mx-4 mt-4 space-y-2.5 border-t border-slate-100 py-4 text-xs"><div className="flex justify-between"><span>Activos</span><strong className="text-emerald-600">{stats.activeDrivers}</strong></div><div className="flex justify-between"><span>Otros estados</span><strong>{data.drivers.length-stats.activeDrivers}</strong></div></div><Link to="/admin/conductores" className="mx-4 mb-4 flex min-h-9 items-center justify-center rounded-lg border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-50">Gestionar conductores <ArrowRight size={14} className="ml-2"/></Link></section>
      <section className={`${card} overflow-hidden`}><SectionHeader icon={CircleAlert} label="Documentos por revisar" href="/admin/documentos"/><div className="space-y-1 px-3 py-2">{dueDocuments.slice(0,4).map(d=><div key={d.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-2"><FileText size={17} className="shrink-0 text-[#d61339]"/><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold">{documentLabels[d.type]}</span><span className="block text-[10px] text-slate-500">{formatDate(d.expiresAt)}</span></span><span className={`shrink-0 rounded px-1.5 py-1 text-[9px] font-bold ${documentState(d)==='vencido'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{documentState(d)==='vencido'?'Vencido':'Por vencer'}</span></div>)}{dueDocuments.length===0&&<div className="py-10 text-center"><CheckCheck className="mx-auto text-emerald-500" size={24}/><p className="mt-2 text-xs text-slate-500">No hay alertas registradas.</p></div>}</div></section>
      <section className={`${card} overflow-hidden`}><SectionHeader icon={Activity} label="Actividad reciente" href="/admin/solicitudes" action="Ver solicitudes"/><div className="space-y-3 px-4 py-3">{activity.slice(0,5).map((a,i)=><div key={`${a.id}-${i}`} className="flex items-start gap-2.5"><span className={`mt-1 grid size-7 shrink-0 place-items-center rounded-full ${i%2?'bg-blue-100 text-blue-700':'bg-emerald-100 text-emerald-700'}`}>{i%2?<BellRing size={13}/>:<BadgeCheck size={13}/>}</span><span className="min-w-0"><span className="block truncate text-[11px] font-bold">{a.description}</span><span className="block truncate text-[10px] text-slate-500">{a.who} · {formatDate(a.date)}</span></span></div>)}{activity.length===0&&<p className="py-8 text-xs text-slate-500">No hay actividad reciente.</p>}</div></section>
    </div>
    <section className={`${card} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}><div><p className="text-sm font-bold">Pagos mensuales · {year}</p><p className="text-xs text-slate-500">Registros existentes en este navegador · Total {moneyShort(monthly.reduce((a,b)=>a+b,0))}{year===new Date().getFullYear()?` · Este mes ${moneyShort(monthTotal)}`:''}</p></div><div className="flex items-center gap-3"><label htmlFor="dashboard-year" className="text-xs font-semibold text-[#103467]">Año</label><input id="dashboard-year" type="number" min="2000" max="2100" value={year} onChange={e=>setYear(Number(e.target.value))} className="h-10 w-24 rounded-lg border border-slate-300 px-2 text-sm"/><Link to="/admin/pagos" className="inline-flex h-10 items-center gap-1 rounded-lg bg-[#0e3e90] px-3 text-xs font-bold text-white">Ver pagos <ArrowRight size={13}/></Link></div></section>
  </section></SolicitudesLayout>
}
