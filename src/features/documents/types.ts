export const documentTypes = ['licencia', 'carne', 'tarjeta_propiedad', 'dni', 'afocat', 'soat', 'revision_tecnica', 'gas', 'otro'] as const
export type DocumentType = (typeof documentTypes)[number]
export type DocumentOwner = 'conductor' | 'vehiculo'
export interface ManagedDocument {
  id: string
  ownerType: DocumentOwner
  ownerId: string
  type: DocumentType
  number: string
  issuedAt: string
  expiresAt: string
  fileName: string
  dataUrl: string
  createdAt: string
}
export type DocumentValues = Omit<ManagedDocument, 'id' | 'createdAt'>
