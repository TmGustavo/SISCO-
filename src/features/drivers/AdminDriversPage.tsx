import { SectionPage } from '../../components/ui/SectionPage'

export function AdminDriversPage() {
  return <SectionPage eyebrow="Administración" title="Conductores" description="Datos de conductores, postulaciones y fichas enriquecidas con IA cuando ese módulo sea habilitado." metrics={[{ label: 'Conductores activos', value: '37' }, { label: 'Postulaciones', value: '5' }, { label: 'Fichas por revisar', value: '8' }]} />
}
