import { SectionPage } from '../../components/ui/SectionPage'

export function AdminRentalsPage() {
  return <SectionPage eyebrow="Administración" title="Alquileres" description="Gestión de contratos de alquiler, unidades asignadas y fechas de vencimiento." metrics={[{ label: 'Alquileres vigentes', value: '14' }, { label: 'Por vencer', value: '3' }, { label: 'Disponibles', value: '6' }]} />
}
