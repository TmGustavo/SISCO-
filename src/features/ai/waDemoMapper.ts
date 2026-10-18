/** Adaptador: la salida JSON de Gemini -> modelo existente del panel administrativo. */
import type { RequestFormValues } from '../solicitudes/types.ts'
import type { EstadoAgente, TipoFlujo } from './waDemoTypes.ts'

const limpio = (v: string) => v.trim()
const fechaIso = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ''

/** Información mínima para borrador de DEMOSTRACIÓN. Nunca equivale a aprobación. */
export function datosPendientes(estado: EstadoAgente | null, flujo: TipoFlujo): string[] {
  if (!estado || !flujo || flujo === 'requisitos' || flujo === 'taxi') return []
  const d = estado.datos
  const faltan: string[] = []
  if (!limpio(d.nombre)) faltan.push('nombre (ficticio para la prueba)')
  switch (flujo) {
    case 'afiliacion':
      if (!limpio(d.vehiculo)) faltan.push('vehículo')
      if (!d.zonas.length) faltan.push('zona de trabajo')
      break
    case 'conductores':
      if (!d.zonas.length) faltan.push('zona de trabajo')
      break
    case 'alquileres':
      if (!limpio(d.vehiculo)) faltan.push('tipo de vehículo solicitado')
      break
    case 'turismo':
      if (!limpio(d.destino)) faltan.push('destino')
      if (!limpio(d.fecha)) faltan.push('fecha estimada')
      if (!limpio(d.pasajeros)) faltan.push('cantidad de pasajeros')
      break
  }
  return faltan
}

/** Devuelve null si faltan datos, o si la conversación es solo una consulta. */
export function convertirABorrador(estado: EstadoAgente | null, flujo: TipoFlujo): RequestFormValues | null {
  if (!estado || !flujo || flujo === 'requisitos' || datosPendientes(estado, flujo).length) return null
  const d = estado.datos
  const cabecera = `DEMO — Ficha sugerida por IA. Pendiente de revisión humana. No hay documentos verificados, reserva confirmada ni pago.`
  const comun = {
    name: limpio(d.nombre), identity: '', email: '', phone: '',
    serviceDate: fechaIso(d.fecha),
  }
  switch (flujo) {
    case 'afiliacion': return {
      ...comun, type: 'afiliacion', reference: d.vehiculo,
      serviceDate: '',
      description: `${cabecera}\nVehículo: ${d.vehiculo}. Capacidad: ${d.capacidad_vehiculo || 'sin especificar'}. Zonas: ${d.zonas.join(', ')}. Disponibilidad: ${d.disponibilidad_dias} ${d.disponibilidad_turno}.\n${estado.resumen}`,
    }
    case 'conductores': return {
      ...comun, type: 'conductores', reference: 'Postulación de conductor', serviceDate: '',
      description: `${cabecera}\nZonas de trabajo: ${d.zonas.join(', ')}. Disponibilidad: ${d.disponibilidad_dias} ${d.disponibilidad_turno}.\n${estado.resumen}`,
    }
    case 'alquileres': return {
      ...comun, type: 'alquileres', reference: d.vehiculo,
      description: `${cabecera}\nVehículo solicitado: ${d.vehiculo}. Fecha indicada: ${d.fecha || 'por coordinar'}.\n${estado.resumen}`,
    }
    case 'turismo': return {
      ...comun, type: 'turismo', reference: d.destino,
      description: `${cabecera}\nDestino: ${d.destino}. Pasajeros: ${d.pasajeros}. Fecha indicada: ${d.fecha}.\n${estado.resumen}`,
    }
    case 'taxi': return null // Aún no existe RequestType='taxi'; no guardamos datos bajo otra categoría.

  }
  return null
}
