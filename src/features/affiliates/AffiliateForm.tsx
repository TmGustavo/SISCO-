import { useCallback, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { Solicitud } from '../solicitudes/types.ts'
import { useModalFocus } from '../solicitudes/useModalFocus.ts'
import { emptyForm, toForm, validateForm } from './model.ts'
import type { Affiliate, AffiliateFormValues, FormErrors } from './types.ts'

const input = 'mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-[#071b46] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200'

export function AffiliateForm({ affiliate, initialRequest, affiliates, requests, onClose, onSave }: { affiliate?: Affiliate; initialRequest?: Solicitud; affiliates: Affiliate[]; requests: Solicitud[]; onClose: () => void; onSave: (values: AffiliateFormValues) => string | void }) {
  const [values, setValues] = useState<AffiliateFormValues>(() => affiliate ? toForm(affiliate) : { ...emptyForm(), ...(initialRequest ? { status: 'activo', requestId: initialRequest.id, name: initialRequest.name, identity: initialRequest.identity, email: initialRequest.email, phone: initialRequest.phone.replace(/\s/g, ''), plate: initialRequest.reference.toUpperCase() } : {}) })
  const [errors, setErrors] = useState<FormErrors>({})
  const [saveError, setSaveError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => onClose(), [onClose])
  useModalFocus(modalRef, close, true)
  const set = (key: keyof AffiliateFormValues, value: string) => { setValues(v => ({ ...v, [key]: value })); setErrors(e => ({ ...e, [key]: undefined })) }
  const field = (key: keyof AffiliateFormValues, label: string, type = 'text') => <label className="block text-sm font-semibold text-[#071b46]">{label}<input className={input} type={type} value={values[key]} onChange={e => set(key, e.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} />{errors[key] && <span id={`error-${key}`} className="mt-1 block text-xs font-normal text-red-700">{errors[key]}</span>}</label>
  const affiliationRequests = requests.filter(r => r.type === 'afiliacion')
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="affiliate-form-title" className="max-h-[95dvh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
    <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-3"><div><h2 id="affiliate-form-title" className="text-lg font-bold">{initialRequest ? 'Aprobar y registrar afiliado' : affiliate ? 'Editar ficha' : 'Registrar afiliado'}</h2><p className="text-xs text-slate-500">{initialRequest ? 'Completa y confirma la ficha para aprobar la solicitud.' : 'Todos los campos son obligatorios, salvo la solicitud vinculada.'}</p></div><button data-autofocus type="button" onClick={onClose} aria-label="Cerrar formulario" className="grid size-11 shrink-0 place-items-center rounded hover:bg-slate-100"><X size={20} /></button></div>
    <form noValidate onSubmit={e => { e.preventDefault(); const found = validateForm(values, affiliates, requests, affiliate?.id); setErrors(found); if (!Object.keys(found).length) setSaveError(onSave(values) ?? '') }} className="space-y-5 p-5">
      <fieldset><legend className="mb-3 font-bold">Información personal</legend><div className="grid gap-4 sm:grid-cols-2">{field('name', 'Nombre completo')}{field('identity', 'DNI')}{field('phone', 'Teléfono', 'tel')}{field('email', 'Correo electrónico', 'email')}{field('address', 'Dirección')}{field('joinedAt', 'Fecha de ingreso', 'date')}
        <label className="text-sm font-semibold">Tipo de afiliación<select className={input} value={values.type} onChange={e => set('type', e.target.value)}><option value="propietario">Propietario</option><option value="alquilado">Alquilado</option></select></label>
        <label className="text-sm font-semibold">Estado<select className={input} disabled={!!initialRequest} value={values.status} onChange={e => set('status', e.target.value)}><option value="pendiente">Pendiente</option><option value="activo">Activo</option><option value="suspendido">Suspendido</option></select></label>
        <label className="text-sm font-semibold sm:col-span-2">Solicitud de afiliación vinculada<select className={input} disabled={!!initialRequest} value={values.requestId} onChange={e => { const request = affiliationRequests.find(r => r.id === e.target.value); setValues(v => ({ ...v, requestId: e.target.value, ...(request && !affiliate ? { name: request.name, identity: request.identity, email: request.email, phone: request.phone.replace(/\s/g, ''), plate: request.reference.toUpperCase() } : {}) })); setErrors(err => ({ ...err, requestId: undefined })) }}><option value="">Sin solicitud vinculada</option>{affiliationRequests.map(r => <option key={r.id} value={r.id}>{r.id} · {r.name} · DNI {r.identity}</option>)}</select>{errors.requestId && <span className="mt-1 block text-xs font-normal text-red-700">{errors.requestId}</span>}</label>
      </div></fieldset>
      <fieldset><legend className="mb-3 font-bold">Información del vehículo</legend><div className="grid gap-4 sm:grid-cols-2">{field('plate', 'Placa (ABC-123)')}{field('brand', 'Marca')}{field('model', 'Modelo')}{field('year', 'Año')}{field('color', 'Color')}{field('monthlyFee', 'Cuota mensual (S/)')}</div></fieldset>
      {Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-red-700">Revisa los campos señalados antes de guardar.</p>}
      {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
      <div className="flex flex-wrap justify-end gap-2 border-t pt-4"><button type="button" onClick={onClose} className="min-h-11 rounded-md border border-slate-300 px-5 text-sm font-semibold">Cancelar</button><button type="submit" className="min-h-11 rounded-md bg-[#e60027] px-5 text-sm font-bold text-white hover:bg-red-700">Guardar afiliado</button></div>
    </form>
  </div></div>
}
