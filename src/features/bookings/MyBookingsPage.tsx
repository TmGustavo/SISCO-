import { SectionPage } from '../../components/ui/SectionPage'

export function MyBookingsPage() {
  return <SectionPage eyebrow="Cliente" title="Mis reservas" description="Aquí podrás consultar el estado de tus reservas de turismo y transporte. Actualmente se muestran datos simulados." metrics={[{ label: 'Próximas reservas', value: '1' }, { label: 'Historial', value: '3' }]} />
}
