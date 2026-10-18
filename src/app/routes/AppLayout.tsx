import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

const navigation = [
  { to: '/turismo', label: 'Turismo' },
  { to: '/mis-reservas', label: 'Mis reservas' },
  { to: '/conductor', label: 'Conductor' },
  { to: '/admin/dashboard', label: 'Administración' },
]

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
      <Link to="/turismo" className="text-lg font-bold tracking-tight text-teal-800" onClick={closeMenu}>Kaluz <span className="text-slate-500">Digital</span></Link>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">{navigation.map(({ to, label }) => <NavLink key={to} to={to} className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>{label}</NavLink>)}<NavLink to="/login" className="ml-3 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">Ingresar</NavLink></nav>
      <button type="button" className="rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
    </div>{menuOpen && <nav className="border-t border-slate-200 px-4 py-3 md:hidden" aria-label="Navegación móvil"><div className="mx-auto flex max-w-6xl flex-col gap-1">{[...navigation, { to: '/login', label: 'Ingresar' }].map(({ to, label }) => <NavLink key={to} to={to} onClick={closeMenu} className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">{label}</NavLink>)}</div></nav>}</header>
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6"><Outlet /></main>
    <footer className="mt-12 border-t border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500 sm:px-6">Kaluz Digital · Transporte, afiliados y turismo</div></footer>
  </div>
}
