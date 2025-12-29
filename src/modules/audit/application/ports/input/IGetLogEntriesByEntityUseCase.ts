import { LogEntry } from '../../../domain/entities/LogEntry';
import { LogEntity } from '../../../domain/enums/LogEntity';

/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener logs por entidad
 */
export interface IGetLogEntriesByEntityUseCase {
  /**
   * Obtiene todos los logs de una entidad específica
   * @param entity - Tipo de entidad
   * @param entityId - ID de la entidad
   * @param limit - Límite de resultados (opcional, default: 20)
   * @param offset - Offset para paginación (opcional, default: 0)
   * @returns Lista de logs y total de resultados
   */
  execute(
    entity: LogEntity,
    entityId: string,
    limit?: number,
    offset?: number
  ): Promise<{ logs: LogEntry[]; total: number }>;
}
