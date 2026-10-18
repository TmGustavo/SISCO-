import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { applyAction, createRequest, filterRequests, getStats, validateRequest } from '../src/features/solicitudes/model.ts'
import { loadRequests, saveRequests, seedRequests, STORAGE_KEY } from '../src/features/solicitudes/storage.ts'
import type { RequestFormValues } from '../src/features/solicitudes/types.ts'

const values: RequestFormValues = { type: 'turismo', name: '  María Ejemplo  ', identity: '12345678', email: 'maria@ejemplo.com', phone: '987 654 321', reference: 'Cusco', serviceDate: '2027-03-02', description: 'Dos pasajeros' }

test('valida los datos obligatorios y los campos específicos del tipo', () => {
  assert.deepEqual(validateRequest(values), {})
  const errors = validateRequest({ ...values, name: 'A', identity: '', email: 'incorrecto', phone: '123', reference: '', serviceDate: '' })
  assert.deepEqual(Object.keys(errors).sort(), ['email', 'identity', 'name', 'phone', 'reference', 'serviceDate'].sort())
  for (const type of ['afiliacion', 'conductores'] as const) assert.equal(validateRequest({ ...values, type, serviceDate: '' }).serviceDate, undefined)
  for (const type of ['alquileres', 'turismo'] as const) assert.ok(validateRequest({ ...values, type, serviceDate: '' }).serviceDate)
  assert.ok(validateRequest({ ...values, serviceDate: '2027-02-30' }).serviceDate)
  assert.equal(validateRequest({ ...values, serviceDate: '2028-02-29' }).serviceDate, undefined)
})

test('crear, filtrar y calcular estadísticas utiliza los mismos registros', () => {
  const request = createRequest(values, new Date('2026-10-18T12:00:00Z'))
  const requests = [request, ...seedRequests(new Date('2026-10-18T12:00:00Z'))]
  assert.equal(request.name, 'María Ejemplo')
  assert.equal(request.status, 'pendiente')
  assert.ok(request.documents.length > 0 && request.requirements.length > 0)
  assert.equal(getStats(requests).total, 9)
  assert.equal(getStats(requests).byType.turismo, 3)
  assert.deepEqual(filterRequests(requests, request.id.toLowerCase(), 'turismo', 'pendiente').map((item) => item.id), [request.id])
  assert.deepEqual(filterRequests(requests, 'maria ejemplo', 'turismo', 'todos').map((item) => item.id), [request.id])
  assert.equal(filterRequests(requests, 'maría ejemplo', 'afiliacion', 'todos').length, 0)
})

test('las acciones actualizan el estado, conservan el registro y exigen motivo cuando corresponde', () => {
  const original = createRequest(values)
  const reviewed = applyAction(original, 'revisar')
  const approved = applyAction(reviewed, 'aprobar')
  assert.equal(approved.status, 'aprobada')
  assert.equal(original.status, 'pendiente')
  assert.equal(approved.history.length, 3)
  assert.throws(() => applyAction(original, 'observar', '  '), /motivo/)
  assert.throws(() => applyAction(original, 'rechazar'), /motivo/)
  const observed = applyAction(original, 'observar', ' Falta licencia ')
  assert.equal(observed.status, 'observada')
  assert.equal(observed.history[0].note, 'Falta licencia')
  assert.equal(applyAction(observed, 'rechazar', 'No cumple').status, 'rechazada')
})

test('persiste, recupera y maneja datos dañados o almacenamiento no disponible', () => {
  const data = new Map<string, string>()
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) } }
  const requests = [createRequest(values)]
  assert.equal(saveRequests(storage, requests), true)
  assert.deepEqual(loadRequests(storage).requests, requests)
  data.set(STORAGE_KEY, '{malformado')
  assert.notEqual(loadRequests(storage).warning, '')
  data.set(STORAGE_KEY, JSON.stringify([{ id: 'incompleto' }]))
  assert.notEqual(loadRequests(storage).warning, '')
  assert.equal(saveRequests({ setItem: () => { throw new Error('cuota') } }, requests), false)
})
