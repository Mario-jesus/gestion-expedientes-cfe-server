import { DocumentKind } from '../../../domain/enums/DocumentKind';

/**
 * DTO para actualizar un tipo de documento existente
 * Todos los campos son opcionales (actualización parcial)
 */
export interface UpdateDocumentTypeDTO {
  nombre?: string;
  kind?: DocumentKind;
  descripcion?: string;
  isActive?: boolean;
}
