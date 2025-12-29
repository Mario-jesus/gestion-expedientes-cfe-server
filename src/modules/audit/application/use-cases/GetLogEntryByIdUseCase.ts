import { ILogger } from '@shared/domain';
import { LogEntry } from '../../domain';
import { ILogEntryRepository } from '../../domain/ports/output/ILogEntryRepository';
import { IGetLogEntryByIdUseCase } from '../ports/input/IGetLogEntryByIdUseCase';

/**
 * Caso de uso para obtener un log de auditoría por su ID
 */
export class GetLogEntryByIdUseCase implements IGetLogEntryByIdUseCase {
  constructor(
    private readonly logEntryRepository: ILogEntryRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID del log a buscar
   * @returns El log si existe, null si no existe
   */
  async execute(id: string): Promise<LogEntry | null> {
    this.logger.debug('Ejecutando caso de uso: Obtener log por ID', {
      logId: id,
    });

    const logEntry = await this.logEntryRepository.findById(id);

    if (!logEntry) {
      this.logger.debug('Log no encontrado', {
        logId: id,
      });
      return null;
    }

    this.logger.debug('Log obtenido exitosamente', {
      logId: id,
      userId: logEntry.userId,
      action: logEntry.action,
      entity: logEntry.entity,
    });

    return logEntry;
  }
}
