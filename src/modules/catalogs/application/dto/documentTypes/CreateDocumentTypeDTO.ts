import { DocumentKind } from '../../../domain/enums/DocumentKind';

/**
 * DTO para crear un nuevo tipo de documento
 * Representa los datos que vienen del request HTTP
 */
export interface CreateDocumentTypeDTO {
  nombre: string;
  kind: DocumentKind;
  descripcion?: string;
  isActive?: boolean; // Default: true
}
