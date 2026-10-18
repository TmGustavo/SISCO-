import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Bell, CarFront, ChevronDown, ClipboardCheck, CreditCard, FileText,
  LayoutDashboard, MapPin, Menu,
  UsersRound, UserRound, X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useModalFocus } from './useModalFocus.ts'

const navigation = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/afiliados', label: 'Afiliados', icon: UsersRound },
  { to: '/admin/conductores', label: 'Conductores', icon: UserRound },
  { to: '/admin/vehiculos', label: 'Vehículos', icon: CarFront },
  { to: '/admin/pagos', label: 'Pagos', icon: CreditCard },
  { to: '/admin/documentos', label: 'Documentos', icon: FileText },
  { to: '/admin/alquileres', label: 'Alquileres', icon: CarFront },
  { to: '/admin/solicitudes', label: 'Solicitudes', icon: ClipboardCheck },
  { to: '/admin/gps', label: 'GPS', icon: MapPin },
]

export function SolicitudesLayout({ children, active = 'Solicitudes' }: {
  children: ReactNode
  active?: 'Dashboard' | 'Solicitudes' | 'Afiliados' | 'Conductores' | 'Vehículos' | 'Documentos' | 'Pagos' | 'Alquileres'
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useModalFocus(menuRef, closeMenu, menuOpen)
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const change = () => { if (desktop.matches) closeMenu() }
    desktop.addEventListener('change', change)
    return () => desktop.removeEventListener('change', change)
  }, [closeMenu])
  const date = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())

  return <div className="min-h-screen bg-[#edf2fa] text-[#0d234b] lg:pl-[218px]">
    {menuOpen && <button type="button" aria-label="Cerrar navegación" className="fixed inset-0 z-40 bg-slate-950/65 lg:hidden" onClick={closeMenu} />}
    <aside
      ref={menuRef} id="admin-navigation" role={menuOpen ? 'dialog' : undefined} aria-modal={menuOpen ? true : undefined}
      aria-label={menuOpen ? 'Menú de administración' : undefined}
      className={`fixed inset-y-0 left-0 z-50 flex w-[238px] flex-col overflow-y-auto bg-[#06183c] text-white shadow-[8px_0_36px_rgba(3,18,47,.16)] transition-transform lg:w-[218px] lg:translate-x-0 ${menuOpen ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'}`}
    >
      <div className="relative overflow-hidden border-b border-white/10 px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute -right-12 -top-10 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="flex items-start justify-between gap-2">
          <Link to="/admin/dashboard" onClick={closeMenu} aria-label="Kaluz Digital, ir al dashboard" className="relative block rounded-lg px-2 py-2 text-white">
            <span className="block -skew-x-6 text-[35px] font-black italic leading-none tracking-[-.08em] drop-shadow-[2px_2px_0_#e5002d]">KALUZ</span>
            <span className="mt-1 block text-center text-[10px] font-extrabold uppercase tracking-[.47em] text-red-400">DIGITAL</span>
            <span className="mt-2 block text-center text-[9px] font-semibold uppercase tracking-[.18em] text-blue-200/90">Taxi • Huancayo</span>
          </Link>
          <button data-autofocus type="button" onClick={closeMenu} aria-label="Cerrar menú de administración" className="grid size-11 place-items-center rounded-lg hover:bg-white/10 lg:hidden"><X size={21}/></button>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-400/20 bg-white/[.07] px-3 py-2.5">
          <span className="text-lg" aria-hidden="true">♛</span>
          <div><p className="text-[10px] font-black uppercase tracking-wide text-amber-200">Dueño / administrador</p><p className="text-[10px] text-blue-100/70">Centro de control</p></div>
        </div>
      </div>
      <nav aria-label="Navegación administrativa" className="flex-1 space-y-1.5 px-3 py-5">
        {navigation.map(({ to, label, icon: Icon }) => {
          const selected = location.pathname === to || (label === active && !navigation.some(n => n.to === location.pathname))
          return <Link key={to} to={to} onClick={closeMenu} aria-current={selected ? 'page' : undefined}
            className={`group flex min-h-11 items-center gap-3.5 rounded-[11px] px-3.5 py-3 text-sm font-semibold transition ${selected ? 'bg-[#ea0631] text-white shadow-[0_5px_13px_rgba(234,6,49,.23)]' : 'text-slate-100 hover:bg-white/10 hover:text-white'}`}>
            <Icon size={19} strokeWidth={selected ? 2.5 : 2} className="shrink-0"/><span>{label}</span>
          </Link>
        })}
      </nav>
      <div className="relative hidden overflow-hidden border-t border-white/10 px-5 py-6 lg:block">
        <div className="absolute bottom-0 right-0 h-28 w-28 rounded-full bg-[#e6002d]/10 blur-xl" />
        <div className="mb-3 h-1.5 w-12 -skew-x-12 bg-[#f50935]"/>
        <p className="relative text-[10px] font-bold uppercase leading-[1.85] tracking-[.22em] text-blue-100">Personas moviendo grandes historias</p>
        <p className="relative mt-4 flex items-center gap-1 text-[10px] text-blue-300"><MapPin size={12}/> Huancayo, Junín</p>
      </div>
    </aside>
    <div className="relative hidden h-[81px] overflow-hidden bg-[#071a42] text-white lg:block">
      <div className="absolute inset-0 opacity-40" style={{ background: 'linear-gradient(115deg,#071a42 13%,#1a468a 58%,#091b44 100%)' }} />
      <div className="absolute -right-12 -top-20 h-56 w-[48%] skew-x-[-26deg] border-l-[28px] border-[#ee113c]/70 bg-blue-500/10" />
      <div className="absolute right-[12%] top-0 h-full w-36 opacity-30" style={{ backgroundImage:'conic-gradient(#fff 25%,transparent 0 50%,#fff 0 75%,transparent 0)', backgroundSize:'32px 32px', transform:'skewX(-18deg)' }} />
      <div className="relative flex h-full items-center justify-between px-7 2xl:px-10">
        <div className="flex items-center gap-4"><div className="h-9 w-1.5 skew-x-[-20deg] bg-[#ff1744]"/><div><p className="text-lg font-black italic uppercase tracking-[.08em]">Transporte seguro</p><p className="-mt-1 text-xs font-bold italic uppercase tracking-[.17em] text-blue-100">para una mejor Huancayo</p></div></div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><MapPin size={20} className="text-red-300"/><span>Huancayo<br/><span className="text-blue-200">Región Junín</span></span></div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-[#eb0032]" />
    </div>
    <header className="sticky top-0 z-30 flex min-h-[70px] items-center justify-between gap-3 border-b border-slate-200/90 bg-white/95 px-4 shadow-[0_3px_15px_rgba(15,36,71,.05)] backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <button type="button" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen(!menuOpen)} className="grid size-11 shrink-0 place-items-center rounded-lg text-[#071b46] hover:bg-slate-100 lg:hidden">{menuOpen ? <X size={23}/> : <Menu size={23}/>}</button>
        <div className="min-w-0"><p className="truncate text-sm font-black tracking-tight text-[#082453] sm:text-base">Panel de Administración</p><p className="truncate text-[11px] text-slate-500">Taxi Kaluz Digital <span className="mx-1 text-slate-300">|</span> Huancayo, Junín <span className="mx-1 text-slate-300">|</span> {active}</p></div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4"><span className="hidden text-xs font-medium capitalize text-slate-500 xl:block">{date}</span><Bell size={19} className="hidden text-[#0a285e] sm:block" aria-label="Notificaciones"/><span className="grid size-9 place-items-center rounded-full bg-[#e5edfb] text-xs font-extrabold text-[#0a2b63]">AK</span><div className="hidden leading-tight sm:block"><span className="block text-xs font-bold">Admin Kaluz</span><span className="block text-[11px] text-slate-400">Administrador</span></div><ChevronDown size={14} className="hidden text-slate-500 sm:block"/></div>
    </header>
    <main className="mx-auto w-full max-w-[1740px] px-3 pb-9 sm:px-5 2xl:px-7">{children}</main>
  </div>
}
