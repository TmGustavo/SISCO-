import { SectionPage } from '../../components/ui/SectionPage'

export function AdminDashboardPage() {
  return <SectionPage eyebrow="Administración" title="Dashboard" description="Indicadores generales de la operación. Todos los valores son simulados hasta conectar los servicios autorizados." metrics={[{ label: 'Afiliados activos', value: '48' }, { label: 'Vehículos operativos', value: '41' }, { label: 'Reservas este mes', value: '126' }]} />
}
