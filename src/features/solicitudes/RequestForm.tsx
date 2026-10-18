import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { referenceLabels, typeLabels, validateRequest } from './model.ts'
import { requestTypes } from './types.ts'
import type { FormErrors, RequestFormValues, RequestType } from './types.ts'
import { useModalFocus } from './useModalFocus.ts'

const emptyForm: RequestFormValues = { type: 'afiliacion', name: '', identity: '', email: '', phone: '', reference: '', serviceDate: '', description: '' }
const inputStyle = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:text-sm'

interface Props { onClose: () => void; onCreate: (values: RequestFormValues) => void }

export function RequestForm({ onClose, onCreate }: Props) {
  const [values, setValues] = useState<RequestFormValues>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const dialogRef = useRef<HTMLElement>(null)
  useModalFocus(dialogRef, onClose)

  function setField<K extends keyof RequestFormValues>(field: K, value: RequestFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validateRequest(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) onCreate(values)
    else requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
  }
  const field = (key: 'name' | 'identity' | 'email' | 'phone' | 'reference' | 'serviceDate', label: string, type = 'text', placeholder = '') => <label className="block text-sm font-semibold text-slate-700">{label}<span className="text-rose-500"> *</span>
    <input className={inputStyle} type={type} required value={values[key]} placeholder={placeholder} onChange={(event) => setField(key, event.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} />
    {errors[key] && <span id={`error-${key}`} className="mt-1 block text-xs font-normal text-rose-600">{errors[key]}</span>}
  </label>

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="new-request-title" className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Nueva solicitud</p><h2 id="new-request-title" className="mt-1 text-xl font-bold text-slate-900">Registrar solicitud</h2><p className="mt-1 text-sm text-slate-500">Completa los datos para agregarla a la bandeja.</p></div><button data-autofocus type="button" onClick={onClose} aria-label="Cerrar formulario" className="flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>
      <form onSubmit={submit} noValidate>
        <div className="space-y-5 px-6 py-6">
          <label className="block text-sm font-semibold text-slate-700">Tipo de solicitud<span className="text-rose-500"> *</span><select className={inputStyle} value={values.type} onChange={(event) => { setField('type', event.target.value as RequestType); setField('reference', ''); setField('serviceDate', '') }}>{requestTypes.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></label>
          <div className="grid gap-5 sm:grid-cols-2">{field('name', 'Nombre completo', 'text', 'Nombre y apellidos')}{field('identity', 'Documento de identidad', 'text', 'Número de documento')}{field('email', 'Correo electrónico', 'email', 'nombre@correo.com')}{field('phone', 'Teléfono', 'tel', 'Número de contacto')}{field('reference', referenceLabels[values.type])}{(values.type === 'alquileres' || values.type === 'turismo') && field('serviceDate', 'Fecha solicitada', 'date')}</div>
          <label className="block text-sm font-semibold text-slate-700">Información adicional <span className="font-normal text-slate-400">(opcional)</span><textarea className={`${inputStyle} min-h-24 resize-y`} value={values.description} onChange={(event) => setField('description', event.target.value)} placeholder="Agrega detalles que ayuden a revisar la solicitud" /></label>
          <p className="text-xs text-slate-500">Los campos marcados con * son obligatorios. Los documentos se pueden registrar en el detalle.</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button><button type="submit" className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">Registrar solicitud</button></div>
      </form>
    </section>
  </div>
}
