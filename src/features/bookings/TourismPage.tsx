import { BusFront, MapPin, Plane } from 'lucide-react'
import { ButtonLink } from '../../components/ui/ButtonLink'

interface ServiceSummary {
  id: string
  name: string
  description: string
}

const services: Array<ServiceSummary & { icon: typeof BusFront }> = [
  { id: 'transporte', name: 'Transporte privado', description: 'Traslados coordinados para personas, familias y empresas.', icon: BusFront },
  { id: 'turismo', name: 'Experiencias turísticas', description: 'Consulta rutas y salidas de turismo con el equipo Kaluz.', icon: Plane },
  { id: 'traslados', name: 'Traslados locales', description: 'Coordina punto de partida, destino y horario.', icon: MapPin },
]

export function TourismPage() {
  return <section className="py-10 sm:py-16"><p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Turismo</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Catálogo y reservas</h1><p className="mt-4 max-w-2xl text-slate-600">Explora los servicios disponibles. Los datos son simulados en esta primera etapa.</p><div className="mt-8 grid gap-4 md:grid-cols-3">{services.map(({ id, name, description, icon: Icon }) => <article key={id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="text-teal-700" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold">{name}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}</div><ButtonLink to="/solicitar" className="mt-8">Solicitar una reserva</ButtonLink></section>
}
