/** Contrato de respuesta de Gemini V2. No incluye credenciales. */
export type TipoFlujo = 'afiliacion' | 'conductores' | 'alquileres' | 'turismo' | 'taxi' | 'requisitos' | null
export type RolMensaje = 'usuario' | 'asistente'
export interface MensajeDemo { rol: RolMensaje; texto: string }

export interface EstadoAgente {
  tipo_usuario: 'conductor_nuevo' | 'conductor_afiliado' | 'cliente' | 'desconocido'
  intencion: 'afiliacion' | 'alquiler' | 'consulta_requisitos' | 'consulta_cuota' | 'taxi' | 'turismo' | 'estado_reserva' | 'asesor' | 'otra'
  datos: {
    nombre: string
    vehiculo: string
    capacidad_vehiculo: string
    zonas: string[]
    disponibilidad_dias: string
    disponibilidad_turno: string
    origen: string
    destino: string
    fecha: string
    pasajeros: string
  }
  resumen: string
  faltantes: string[]
  respuesta_usuario: string
  listo_para_revision: boolean
  listo_para_registrar: boolean
  pendientes_documentales: string[]
}
const tipos = new Set(['conductor_nuevo', 'conductor_afiliado', 'cliente', 'desconocido'])
const intenciones = new Set(['afiliacion', 'alquiler', 'consulta_requisitos', 'consulta_cuota', 'taxi', 'turismo', 'estado_reserva', 'asesor', 'otra'])

export function esEstadoAgente(v: unknown): v is EstadoAgente {
  if (typeof v !== 'object' || !v) return false
  const r = v as Partial<EstadoAgente>
  const d = r.datos
  return typeof r.tipo_usuario === 'string' && tipos.has(r.tipo_usuario) &&
    typeof r.intencion === 'string' && intenciones.has(r.intencion) &&
    !!d && typeof d.nombre === 'string' && typeof d.vehiculo === 'string' &&
    Array.isArray(d.zonas) && typeof d.destino === 'string' &&
    typeof r.respuesta_usuario === 'string' && Array.isArray(r.faltantes) &&
    typeof r.listo_para_revision === 'boolean' && typeof r.listo_para_registrar === 'boolean'
}
