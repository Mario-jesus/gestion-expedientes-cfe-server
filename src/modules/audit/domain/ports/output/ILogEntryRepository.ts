import { LogEntry } from '../../entities/LogEntry';
import { LogAction } from '../../enums/LogAction';
import { LogEntity } from '../../enums/LogEntity';

/**
 * Interfaz del repositorio de logs de auditoría
 * Define el contrato para persistir y recuperar logs
 * 
 * Este es un Output Port (Driven Port) - el dominio define lo que necesita
 * 
 * Nota: Los logs son inmutables, por lo que solo se pueden crear y leer
 */
export interface ILogEntryRepository {
  /**
   * Crea un nuevo log de auditoría
   * @param logEntry - Log a crear
   * @returns El log creado
   */
  create(logEntry: LogEntry): Promise<LogEntry>;

  /**
   * Busca un log por su ID
   * @param id - ID del log
   * @returns LogEntry si existe, null si no existe
   */
  findById(id: string): Promise<LogEntry | null>;

  /**
   * Busca todos los logs con filtros opcionales
   * @param filters - Filtros opcionales
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Lista de logs y total
   */
  findAll(
    filters?: {
      userId?: string;
      action?: LogAction;
      entity?: LogEntity;
      entityId?: string;
      fechaDesde?: Date;
      fechaHasta?: Date;
    },
    limit?: number,
    offset?: number
  ): Promise<{ logs: LogEntry[]; total: number }>;

  /**
   * Busca logs por entidad y ID de entidad
   * @param entity - Tipo de entidad
   * @param entityId - ID de la entidad
   * @param limit - Límite de resultados (opcional)
   * @param offset - Offset para paginación (opcional)
   * @returns Lista de logs de la entidad específica
   */
  findByEntity(
    entity: LogEntity,
    entityId: string,
    limit?: number,
    offset?: number
  ): Promise<{ logs: LogEntry[]; total: number }>;

  /**
   * Busca logs por usuario
   * @param userId - ID del usuario
   * @param limit - Límite de resultados (opcional)
   * @param offset - Offset para paginación (opcional)
   * @returns Lista de logs del usuario
   */
  findByUserId(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<{ logs: LogEntry[]; total: number }>;

  /**
   * Busca logs por acción
   * @param action - Tipo de acción
   * @param limit - Límite de resultados (opcional)
   * @param offset - Offset para paginación (opcional)
   * @returns Lista de logs con la acción especificada
   */
  findByAction(
    action: LogAction,
    limit?: number,
    offset?: number
  ): Promise<{ logs: LogEntry[]; total: number }>;

  /**
   * Busca logs por rango de fechas
   * @param fechaDesde - Fecha inicio
   * @param fechaHasta - Fecha fin
   * @param limit - Límite de resultados (opcional)
   * @param offset - Offset para paginación (opcional)
   * @returns Lista de logs en el rango de fechas
   */
  findByDateRange(
    fechaDesde: Date,
    fechaHasta: Date,
    limit?: number,
    offset?: number
  ): Promise<{ logs: LogEntry[]; total: number }>;
}
