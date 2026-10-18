import { PagePlaceholder } from '../../components/ui/PagePlaceholder'
import { isSupabaseConfigured } from '../../lib/supabase'

export function LoginPage() {
  return <PagePlaceholder title="Ingresa a Kaluz Plus" description="La autenticación se conectará a Supabase Auth cuando el entorno tenga sus variables públicas configuradas."><div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">Estado de integración: <strong className="text-slate-900">{isSupabaseConfigured ? 'Supabase configurado' : 'configuración local pendiente'}</strong>.</div></PagePlaceholder>
}
