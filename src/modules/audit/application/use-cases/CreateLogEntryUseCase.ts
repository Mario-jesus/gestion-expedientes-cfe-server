import { ILogger } from '@shared/domain';
import { LogEntry } from '../../domain';
import { ILogEntryRepository } from '../../domain/ports/output/ILogEntryRepository';
import { ICreateLogEntryUseCase } from '../ports/input/ICreateLogEntryUseCase';
import { CreateLogEntryDTO } from '../dto/CreateLogEntryDTO';

/**
 * Caso de uso para crear un log de auditoría
 * 
 * Se encarga de:
 * - Validar los datos del DTO
 * - Crear la entidad LogEntry
 * - Persistir el log
 * 
 * Nota: Normalmente los logs se crean automáticamente desde event handlers,
 * pero este caso de uso permite crear logs manualmente si es necesario
 */
export class CreateLogEntryUseCase implements ICreateLogEntryUseCase {
  constructor(
    private readonly logEntryRepository: ILogEntryRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con los datos del log a crear
   * @returns El log creado
   */
  async execute(dto: CreateLogEntryDTO): Promise<LogEntry> {
    this.logger.info('Ejecutando caso de uso: Crear log de auditoría', {
      userId: dto.userId,
      action: dto.action,
      entity: dto.entity,
      entityId: dto.entityId,
    });

    // Crear la entidad LogEntry
    const logEntry = LogEntry.create({
      userId: dto.userId,
      action: dto.action,
      entity: dto.entity,
      entityId: dto.entityId,
      metadata: dto.metadata,
    });

    // Persistir el log
    const savedLogEntry = await this.logEntryRepository.create(logEntry);

    this.logger.info('Log de auditoría creado exitosamente', {
      logId: savedLogEntry.id,
      userId: savedLogEntry.userId,
      action: savedLogEntry.action,
      entity: savedLogEntry.entity,
      entityId: savedLogEntry.entityId,
    });

    return savedLogEntry;
  }
}
