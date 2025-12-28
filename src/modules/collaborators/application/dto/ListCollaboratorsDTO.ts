import { TipoContrato } from '../../domain/enums/TipoContrato';

/**
 * DTO para listar colaboradores con filtros y paginación
 * Representa los datos que vienen del request HTTP
 */
export interface ListCollaboratorsDTO {
  /**
   * Filtros opcionales para buscar colaboradores
   */
  filters?: {
    /**
     * Filtrar por área
     */
    areaId?: string;

    /**
     * Filtrar por adscripción
     */
    adscripcionId?: string;

    /**
     * Filtrar por puesto
     */
    puestoId?: string;

    /**
     * Filtrar por tipo de contrato
     */
    tipoContrato?: TipoContrato;

    /**
     * Filtrar por estado activo/inactivo
     */
    isActive?: boolean;

    /**
     * Búsqueda por texto (busca en nombre, apellidos o RPE)
     */
    search?: string;

    /**
     * Filtrar por estado del expediente
     */
    estadoExpediente?: 'completo' | 'incompleto' | 'sin_documentos';
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
  sortBy?: 'nombre' | 'rpe' | 'createdAt';

  /**
   * Orden ascendente o descendente
   * Default: 'desc'
   */
  sortOrder?: 'asc' | 'desc';
}
