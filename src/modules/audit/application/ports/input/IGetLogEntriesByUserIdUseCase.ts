import { LogEntry } from '../../../domain/entities/LogEntry';

/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener logs por usuario
 */
export interface IGetLogEntriesByUserIdUseCase {
  /**
   * Obtiene todos los logs de un usuario específico
   * @param userId - ID del usuario
   * @param limit - Límite de resultados (opcional, default: 20)
   * @param offset - Offset para paginación (opcional, default: 0)
   * @returns Lista de logs y total de resultados
   */
  execute(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<{ logs: LogEntry[]; total: number }>;
}
