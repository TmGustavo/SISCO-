import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { demoDocumentDraft } from '../src/features/ai/documentDraft.ts'
import { createDocument, documentState, validateDocument } from '../src/features/documents/model.ts'
import { DOCUMENT_STORAGE_KEY, loadDocuments, saveDocuments } from '../src/features/documents/storage.ts'
import type { DocumentValues } from '../src/features/documents/types.ts'

const value: DocumentValues = { ownerType: 'conductor', ownerId: 'CON-001', type: 'licencia', number: 'Q1234', issuedAt: '2023-01-01', expiresAt: '2025-01-31', fileName: 'prueba.png', dataUrl: 'data:image/png;base64,iVBORw0KGgo=' }
test('valida archivo, propietario y fechas sin declarar autenticidad', () => {
  assert.deepEqual(validateDocument(value, ['CON-001']), [])
  assert.ok(validateDocument({ ...value, ownerId: 'otro', expiresAt: '2023-02-30', dataUrl: 'data:text/html;base64,QQ==' }, ['CON-001']).length >= 3)
  const document = createDocument(value)
  assert.equal(documentState(document, '2025-01-01'), 'por_vencer')
  assert.equal(documentState(document, '2025-02-01'), 'vencido')
  assert.equal(documentState(document, '2024-01-01'), 'vigente')
})
test('borrador de demostración requiere revisión humana', async () => {
  const result = await demoDocumentDraft.createDraft('Número: ABC123\nEmisión: 2023-01-01\nVencimiento: 2025-01-31')
  assert.equal(result.source, 'simulada'); assert.equal(result.fields.number, 'ABC123'); assert.match(result.message, /no verifica autenticidad/)
})
test('guarda y recupera documentos sin sobrescribir corrupción', () => {
  const map = new Map<string, string>(), storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, content: string) => { map.set(key, content) } }
  const document = createDocument(value); assert.equal(saveDocuments(storage, [document]), true); assert.deepEqual(loadDocuments(storage).documents, [document]); map.set(DOCUMENT_STORAGE_KEY, '{mal'); assert.ok(loadDocuments(storage).warning); assert.equal(map.get(DOCUMENT_STORAGE_KEY), '{mal')
})
