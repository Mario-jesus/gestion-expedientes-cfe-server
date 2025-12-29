import { ILogger } from '@shared/domain';
import { LogEntry, LogEntity } from '../../domain';
import { ILogEntryRepository } from '../../domain/ports/output/ILogEntryRepository';
import { IGetLogEntriesByEntityUseCase } from '../ports/input/IGetLogEntriesByEntityUseCase';

/**
 * Caso de uso para obtener todos los logs de una entidad específica
 * 
 * Útil para ver el historial completo de cambios de una entidad
 * (ej: todos los logs de un colaborador específico)
 */
export class GetLogEntriesByEntityUseCase implements IGetLogEntriesByEntityUseCase {
  constructor(
    private readonly logEntryRepository: ILogEntryRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param entity - Tipo de entidad
   * @param entityId - ID de la entidad
   * @param limit - Límite de resultados (opcional, default: 20)
   * @param offset - Offset para paginación (opcional, default: 0)
   * @returns Lista de logs y total de resultados
   */
  async execute(
    entity: LogEntity,
    entityId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ logs: LogEntry[]; total: number }> {
    this.logger.debug('Ejecutando caso de uso: Obtener logs por entidad', {
      entity,
      entityId,
      limit,
      offset,
    });

    const result = await this.logEntryRepository.findByEntity(entity, entityId, limit, offset);

    this.logger.debug('Logs obtenidos exitosamente', {
      entity,
      entityId,
      total: result.total,
      returned: result.logs.length,
    });

    return result;
  }
}
