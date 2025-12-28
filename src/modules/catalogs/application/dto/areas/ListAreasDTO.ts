/**
 * DTO para listar áreas con filtros y paginación
 * Representa los datos que vienen del request HTTP
 */
export interface ListAreasDTO {
  /**
   * Filtros opcionales para buscar áreas
   */
  filters?: {
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
  sortBy?: 'nombre' | 'createdAt';

  /**
   * Orden ascendente o descendente
   * Default: 'desc'
   */
  sortOrder?: 'asc' | 'desc';
}
