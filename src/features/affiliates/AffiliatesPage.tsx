import { SectionPage } from '../../components/ui/SectionPage'

export function AffiliatesPage() {
  return <SectionPage eyebrow="Administración" title="Afiliados" description="Padrón de afiliación y estado de cuotas. La información mostrada es simulada durante esta etapa." metrics={[{ label: 'Afiliados activos', value: '48' }, { label: 'Cuotas al día', value: '39' }, { label: 'Solicitudes pendientes', value: '6' }]} />
}
