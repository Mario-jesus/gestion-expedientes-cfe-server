/**
 * DTO para actualizar un documento
 * Representa los datos que vienen del request HTTP
 * 
 * Nota: collaboratorId y kind NO se pueden cambiar (requiere eliminar y crear nuevo)
 */
export interface UpdateDocumentDTO {
  periodo?: string;
  descripcion?: string;
  documentTypeId?: string; // Solo para kind: 'cchl'
  isActive?: boolean;
}
