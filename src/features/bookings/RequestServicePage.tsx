import { ButtonLink } from '../../components/ui/ButtonLink'
import { PagePlaceholder } from '../../components/ui/PagePlaceholder'

export function RequestServicePage() {
  return <PagePlaceholder title="Solicita tu servicio" description="Próximamente podrás registrar los datos de tu traslado o experiencia turística desde aquí. Esta pantalla deja preparada la ruta del flujo de reservas del MVP."><ButtonLink to="/servicios" variant="secondary">Ver servicios disponibles</ButtonLink></PagePlaceholder>
}
