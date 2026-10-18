import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Bell, CarFront, ChevronDown, ClipboardCheck, CreditCard, FileText, LayoutDashboard, MapPin, Menu, UsersRound, UserRound, X } from 'lucide-react'
import { Link } from 'react-router-dom'
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

export function SolicitudesLayout({ children, active = 'Solicitudes' }: { children: ReactNode; active?: 'Dashboard' | 'Solicitudes' | 'Afiliados' | 'Conductores' | 'Vehículos' | 'Documentos' | 'Pagos' | 'Alquileres' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLElement>(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useModalFocus(menuRef, closeMenu, menuOpen)
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const handleChange = () => { if (desktop.matches) closeMenu() }
    desktop.addEventListener('change', handleChange)
    return () => desktop.removeEventListener('change', handleChange)
  }, [closeMenu])
  const date = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  return <div className="min-h-screen bg-[#eef3f9] text-[#071b46] lg:pl-[190px]">
    {menuOpen && <button type="button" aria-label="Cerrar navegación" className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setMenuOpen(false)} />}
    <aside ref={menuRef} id="admin-navigation" role={menuOpen ? 'dialog' : undefined} aria-modal={menuOpen ? true : undefined} aria-label={menuOpen ? 'Menú de administración' : undefined} className={`fixed inset-y-0 left-0 z-50 flex w-[230px] flex-col overflow-y-auto bg-[#061b40] text-white transition-transform lg:w-[190px] lg:translate-x-0 ${menuOpen ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'}`}>
      <div className="flex items-center justify-between"><Link to="/admin/dashboard" className="flex h-24 items-center px-6" aria-label="Kaluz Digital, ir al dashboard"><span className="-rotate-6 text-2xl font-black italic tracking-tight text-white drop-shadow-md">KALUZ<span className="block text-right text-[9px] font-bold not-italic tracking-[0.25em] text-red-500">DIGITAL</span></span></Link><button data-autofocus type="button" onClick={closeMenu} aria-label="Cerrar menú de administración" className="mr-2 flex size-11 items-center justify-center rounded-lg hover:bg-white/10 lg:hidden"><X size={22} /></button></div>
      <nav aria-label="Navegación administrativa" className="space-y-1 px-2">{navigation.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setMenuOpen(false)} aria-current={label === active ? 'page' : undefined} className={`flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-semibold transition ${label === active ? 'bg-[#e60027] text-white' : 'text-slate-100 hover:bg-white/10'}`}><Icon size={19} />{label}</Link>)}</nav>
      <div className="mt-auto hidden px-6 pb-9 pt-20 lg:block"><div className="h-1 w-10 -skew-x-12 bg-[#e60027]" /><p className="mt-5 text-[10px] font-semibold uppercase leading-5 tracking-[0.23em] text-blue-200">Personas moviendo grandes historias</p><p className="mt-4 text-xs text-blue-300">Huancayo · Región Junín</p></div>
    </aside>
    <div className="hidden h-[84px] overflow-hidden bg-[#071e48] text-white lg:block"><div className="relative flex h-full items-center justify-between overflow-hidden px-9 before:absolute before:bottom-0 before:left-0 before:h-2 before:w-full before:bg-[#e4002b]"><div><p className="text-lg font-black italic uppercase leading-5">Transporte seguro</p><p className="pl-4 text-sm font-bold italic uppercase">para una mejor Huancayo</p></div><div className="absolute right-1/4 top-[-85px] h-44 w-96 rotate-[-15deg] rounded-full bg-blue-400/10" /><div className="relative flex items-center gap-2 text-sm font-bold uppercase"><MapPin size={22} /><span>Huancayo<br />Región Junín</span></div></div></div>
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6"><div className="flex min-w-0 items-center gap-2 sm:gap-4"><button type="button" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen((open) => !open)} className="flex size-11 shrink-0 items-center justify-center rounded-md text-[#071b46] lg:hidden">{menuOpen ? <X size={23} /> : <Menu size={23} />}</button><div className="min-w-0"><p className="truncate text-sm font-bold sm:text-base">Panel de Administración</p><p className="truncate text-xs text-slate-500">Taxi Kaluz Digital <span className="mx-1 text-slate-300">|</span> Huancayo, Junín <span className="mx-1 text-slate-300">|</span> {active}</p></div></div><div className="flex items-center gap-3 text-xs text-slate-500 sm:gap-5"><span className="hidden capitalize xl:block">{date}</span><Bell size={18} className="hidden text-[#071b46] sm:block" aria-hidden="true" /><span className="flex size-8 items-center justify-center rounded-full bg-[#e7edf8] font-bold text-[#102f6b]">AK</span><span className="hidden font-semibold text-[#071b46] sm:block">Admin Kaluz <span className="block font-normal text-slate-400">Administrador</span></span><ChevronDown size={15} className="hidden sm:block" aria-hidden="true" /></div></header>
    <main className="mx-auto w-full max-w-[1600px] px-3 pb-8 sm:px-5">{children}</main>
  </div>
}
