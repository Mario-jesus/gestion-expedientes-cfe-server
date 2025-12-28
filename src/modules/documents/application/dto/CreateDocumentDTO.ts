import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';

/**
 * DTO para crear un nuevo documento
 * Representa los datos que vienen del request HTTP (multipart/form-data)
 */
export interface CreateDocumentDTO {
  collaboratorId: string;
  kind: DocumentKind;
  periodo?: string; // Opcional
  descripcion?: string; // Opcional
  documentTypeId?: string; // Opcional, solo para kind: 'otro'
  // El archivo se maneja por separado en el controller
}
