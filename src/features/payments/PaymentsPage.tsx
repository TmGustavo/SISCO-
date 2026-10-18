import { SectionPage } from '../../components/ui/SectionPage'

export function PaymentsPage() {
  return <SectionPage eyebrow="Administración" title="Pagos y cuotas" description="Control de cuotas, pagos registrados y deudas pendientes con datos simulados." metrics={[{ label: 'Cobrado este mes', value: 'S/ 12,480' }, { label: 'Deuda pendiente', value: 'S/ 2,130' }, { label: 'Pagos por validar', value: '7' }]} />
}
