import { Minute } from '../../entities/Minute';
import { MinuteType } from '../../enums/MinuteType';

/**
 * Interfaz del repositorio de minutas
 * Define el contrato para persistir y recuperar minutas
 * 
 * Este es un Output Port (Driven Port) - el dominio define lo que necesita
 */
export interface IMinuteRepository {
  /**
   * Busca una minuta por su ID
   * @returns Minute si existe, null si no existe
   */
  findById(id: string): Promise<Minute | null>;

  /**
   * Guarda una minuta (crea o actualiza)
   * @param minute - Minuta a guardar
   * @returns La minuta guardada
   */
  save(minute: Minute): Promise<Minute>;

  /**
   * Crea una nueva minuta
   * @param minute - Minuta a crear
   * @returns La minuta creada
   */
  create(minute: Minute): Promise<Minute>;

  /**
   * Actualiza una minuta existente
   * @param minute - Minuta con los cambios
   * @returns La minuta actualizada
   * @throws MinuteNotFoundError si la minuta no existe
   */
  update(minute: Minute): Promise<Minute>;

  /**
   * Elimina una minuta (baja lógica - marca como inactiva)
   * @param id - ID de la minuta a eliminar
   * @returns true si se eliminó, false si no existía
   */
  delete(id: string): Promise<boolean>;

  /**
   * Busca todas las minutas con filtros opcionales
   * @param filters - Filtros opcionales
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Lista de minutas y total
   */
  findAll(
    filters?: {
      tipo?: MinuteType;
      isActive?: boolean;
      fechaDesde?: Date;
      fechaHasta?: Date;
      search?: string; // Búsqueda por título o descripción
    },
    limit?: number,
    offset?: number
  ): Promise<{ minutes: Minute[]; total: number }>;

  /**
   * Busca minutas por tipo
   * @param tipo - Tipo de minuta
   * @param isActive - Si solo buscar activas (default: true)
   * @returns Lista de minutas del tipo especificado
   */
  findByType(
    tipo: MinuteType,
    isActive?: boolean
  ): Promise<Minute[]>;

  /**
   * Busca minutas por rango de fechas
   * @param fechaDesde - Fecha inicio
   * @param fechaHasta - Fecha fin
   * @param isActive - Si solo buscar activas (default: true)
   * @returns Lista de minutas en el rango de fechas
   */
  findByDateRange(
    fechaDesde: Date,
    fechaHasta: Date,
    isActive?: boolean
  ): Promise<Minute[]>;

  /**
   * Busca minutas por título o descripción (búsqueda de texto)
   * @param search - Texto a buscar
   * @param isActive - Si solo buscar activas (default: true)
   * @returns Lista de minutas que coinciden con la búsqueda
   */
  searchByText(
    search: string,
    isActive?: boolean
  ): Promise<Minute[]>;
}
