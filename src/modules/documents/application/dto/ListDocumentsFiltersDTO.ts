import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';

/**
 * DTO para filtrar documentos en listados
 */
export interface ListDocumentsFiltersDTO {
  collaboratorId?: string;
  kind?: DocumentKind;
  isActive?: boolean;
  documentTypeId?: string;
  limit?: number; // Default: 20
  offset?: number; // Default: 0
  sortBy?: 'createdAt' | 'uploadedAt' | 'fileName'; // Default: createdAt
  sortOrder?: 'asc' | 'desc'; // Default: desc
}
