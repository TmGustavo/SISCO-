export interface DocumentDraftResult { source: 'simulada'; fields: { number?: string; issuedAt?: string; expiresAt?: string }; message: string }
export interface DocumentDraftAdapter { createDraft(text: string): Promise<DocumentDraftResult> }
export const demoDocumentDraft: DocumentDraftAdapter = {
  async createDraft(text) {
    const fields: DocumentDraftResult['fields'] = {}
    const labels = { numero: 'number', emision: 'issuedAt', vencimiento: 'expiresAt' } as const
    for (const line of text.split(/[\n;]/)) { const separator = line.indexOf(':'); if (separator < 0) continue; const label = line.slice(0, separator).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() as keyof typeof labels; const key = labels[label]; if (key) fields[key] = line.slice(separator + 1).trim() }
    return { source: 'simulada', fields, message: 'Borrador simulado a partir de texto escrito. Revisa los campos; no verifica autenticidad ni validez legal.' }
  },
}
