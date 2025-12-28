import { DocumentKind } from '../../../domain/enums/DocumentKind';

/**
 * DTO para listar tipos de documento con filtros y paginación
 * Representa los datos que vienen del request HTTP
 */
export interface ListDocumentTypesDTO {
  /**
   * Filtros opcionales para buscar tipos de documento
   */
  filters?: {
    /**
     * Filtrar por kind
     */
    kind?: DocumentKind;

    /**
     * Filtrar por estado activo/inactivo
     */
    isActive?: boolean;

    /**
     * Búsqueda por texto (busca en nombre)
     */
    search?: string;
  };

  /**
   * Límite de resultados por página (paginación)
   * Default: 20
   */
  limit?: number;

  /**
   * Offset para paginación (número de registros a saltar)
   * Default: 0
   */
  offset?: number;

  /**
   * Campo para ordenar
   * Default: 'createdAt'
   */
  sortBy?: 'nombre' | 'kind' | 'createdAt';

  /**
   * Orden ascendente o descendente
   * Default: 'desc'
   */
  sortOrder?: 'asc' | 'desc';
}
