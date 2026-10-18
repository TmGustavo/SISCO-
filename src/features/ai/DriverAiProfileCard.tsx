export interface DriverAiProfileCardProps {
  status?: 'pendiente' | 'listo'
}

/** UI local; la extracción se conectará únicamente mediante una Edge Function protegida. */
export function DriverAiProfileCard({ status = 'pendiente' }: DriverAiProfileCardProps) {
  return <aside className="rounded-xl border border-dashed border-teal-300 bg-teal-50 p-4 text-sm text-teal-950">Ficha con IA: {status === 'listo' ? 'resumen disponible' : 'pendiente de procesamiento seguro'}.</aside>
}
