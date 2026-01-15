/**
 * DTO para listar adscripciones con filtros y paginación
 * Representa los datos que vienen del request HTTP
 */
export interface ListAdscripcionesDTO {
  /**
   * Filtros opcionales para buscar adscripciones
   */
  filters?: {
    /**
     * Filtrar por estado activo/inactivo
     */
    isActive?: boolean;

    /**
     * Búsqueda por texto (busca en nombre y adscripción)
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
