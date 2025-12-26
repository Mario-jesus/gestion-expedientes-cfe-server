import { UserRole } from '../../domain/enums/UserRole';

/**
 * DTO para listar usuarios con filtros y paginación
 * Representa los datos que vienen del request HTTP
 */
export interface ListUsersDTO {
  /**
   * Filtros opcionales para buscar usuarios
   */
  filters?: {
    /**
     * Filtrar por rol
     */
    role?: UserRole;

    /**
     * Filtrar por estado activo/inactivo
     */
    isActive?: boolean;

    /**
     * Búsqueda por texto (busca en username, email o name)
     */
    search?: string;
  };

  /**
   * Límite de resultados por página (paginación)
   * Default: 10
   */
  limit?: number;

  /**
   * Offset para paginación (número de registros a saltar)
   * Default: 0
   */
  offset?: number;
}
