import { SectionPage } from '../../components/ui/SectionPage'

export function AdminRequestsPage() {
  return <SectionPage eyebrow="Administración" title="Solicitudes" description="Bandeja central para postulaciones, consultas y reservas recibidas." metrics={[{ label: 'Nuevas hoy', value: '12' }, { label: 'En evaluación', value: '9' }, { label: 'Reservas confirmadas', value: '18' }]} />
}
