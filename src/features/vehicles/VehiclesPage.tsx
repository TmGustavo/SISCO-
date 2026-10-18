import { SectionPage } from '../../components/ui/SectionPage'

export function VehiclesPage() {
  return <SectionPage eyebrow="Administración" title="Vehículos" description="Registro de unidades, disponibilidad y estado documentario vehicular." metrics={[{ label: 'Unidades registradas', value: '52' }, { label: 'Disponibles', value: '41' }, { label: 'En revisión', value: '4' }]} />
}
