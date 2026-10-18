import { SectionPage } from '../../components/ui/SectionPage'

export function DocumentsPage() {
  return <SectionPage eyebrow="Administración" title="Documentos y vencimientos" description="Control de licencias, AFOCAT, revisiones técnicas y documentación pendiente." metrics={[{ label: 'Por vencer en 30 días', value: '9' }, { label: 'Licencias vigentes', value: '34' }, { label: 'AFOCAT por revisar', value: '4' }]} />
}
