import { ILogger } from '@shared/domain';
import { LogEntry } from '../../domain';
import { ILogEntryRepository } from '../../domain/ports/output/ILogEntryRepository';
import { IGetLogEntriesByUserIdUseCase } from '../ports/input/IGetLogEntriesByUserIdUseCase';

/**
 * Caso de uso para obtener todos los logs de un usuario específico
 * 
 * Útil para ver el historial de actividad de un usuario
 */
export class GetLogEntriesByUserIdUseCase implements IGetLogEntriesByUserIdUseCase {
  constructor(
    private readonly logEntryRepository: ILogEntryRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param userId - ID del usuario
   * @param limit - Límite de resultados (opcional, default: 20)
   * @param offset - Offset para paginación (opcional, default: 0)
   * @returns Lista de logs y total de resultados
   */
  async execute(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ logs: LogEntry[]; total: number }> {
    this.logger.debug('Ejecutando caso de uso: Obtener logs por usuario', {
      userId,
      limit,
      offset,
    });

    const result = await this.logEntryRepository.findByUserId(userId, limit, offset);

    this.logger.debug('Logs obtenidos exitosamente', {
      userId,
      total: result.total,
      returned: result.logs.length,
    });

    return result;
  }
}
