import { SectionPage } from '../../components/ui/SectionPage'

export function GpsPage() {
  return <SectionPage eyebrow="Administración" title="Seguimiento GPS" description="Vista preparada para la futura integración de ubicación de vehículos. No hay rastreo en tiempo real en esta fase." metrics={[{ label: 'Unidades reportando', value: '—' }, { label: 'Alertas', value: '—' }, { label: 'Última actualización', value: 'Pendiente' }]} />
}
