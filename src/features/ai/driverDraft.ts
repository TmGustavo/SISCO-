import type { DriverFormValues } from '../drivers/types.ts'

export interface DriverDraftResult { source: 'simulada'; fields: Partial<DriverFormValues>; notes: string[] }
export interface DriverDraftAdapter { createDraft(text: string): Promise<DriverDraftResult> }

/** Adaptador local de demostración: reconoce etiquetas, no procesa documentos ni consulta servicios de IA. */
export const demoDriverDraft: DriverDraftAdapter = {
  async createDraft(text) {
    const fields: Partial<DriverFormValues> = {}
    const labels: Record<string, keyof DriverFormValues> = { nombre: 'name', dni: 'identity', telefono: 'phone', correo: 'email', direccion: 'address', licencia: 'licenseNumber', categoria: 'licenseCategory', experiencia: 'experienceYears' }
    for (const line of text.split(/[\n;]/)) {
      const separator = line.indexOf(':')
      if (separator < 0) continue
      const label = line.slice(0, separator).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
      const key = labels[label]
      if (key) Object.assign(fields, { [key]: line.slice(separator + 1).trim() })
    }
    return { source: 'simulada', fields, notes: ['Borrador simulado por reglas locales. Revisa y confirma todos los campos antes de guardar.'] }
  },
}
