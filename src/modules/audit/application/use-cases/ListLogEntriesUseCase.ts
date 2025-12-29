import { ILogger } from '@shared/domain';
import { LogEntry } from '../../domain';
import { ILogEntryRepository } from '../../domain/ports/output/ILogEntryRepository';
import { IListLogEntriesUseCase } from '../ports/input/IListLogEntriesUseCase';
import { ListLogEntriesFiltersDTO } from '../dto/ListLogEntriesFiltersDTO';

/**
 * Caso de uso para listar logs de auditoría con filtros y paginación
 * 
 * Se encarga de:
 * - Aplicar filtros opcionales (userId, action, entity, entityId, fechaDesde, fechaHasta)
 * - Aplicar paginación (limit, offset)
 * - Retornar lista de logs y total de resultados
 */
export class ListLogEntriesUseCase implements IListLogEntriesUseCase {
  constructor(
    private readonly logEntryRepository: ILogEntryRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con filtros y parámetros de paginación
   * @returns Lista de logs y total de resultados
   */
  async execute(dto: ListLogEntriesFiltersDTO): Promise<{ logs: LogEntry[]; total: number }> {
    const limit = dto.limit ?? 20; // Default: 20
    const offset = dto.offset ?? 0; // Default: 0

    this.logger.debug('Ejecutando caso de uso: Listar logs de auditoría', {
      filters: {
        userId: dto.userId,
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId,
        fechaDesde: dto.fechaDesde,
        fechaHasta: dto.fechaHasta,
      },
      limit,
      offset,
    });

    // Convertir strings ISO a Date si es necesario
    const fechaDesde = dto.fechaDesde
      ? dto.fechaDesde instanceof Date
        ? dto.fechaDesde
        : new Date(dto.fechaDesde)
      : undefined;

    const fechaHasta = dto.fechaHasta
      ? dto.fechaHasta instanceof Date
        ? dto.fechaHasta
        : new Date(dto.fechaHasta)
      : undefined;

    // Aplicar filtros
    const filters: {
      userId?: string;
      action?: typeof dto.action;
      entity?: typeof dto.entity;
      entityId?: string;
      fechaDesde?: Date;
      fechaHasta?: Date;
    } = {};

    if (dto.userId !== undefined && dto.userId.trim().length > 0) {
      filters.userId = dto.userId.trim();
    }
    if (dto.action !== undefined) {
      filters.action = dto.action;
    }
    if (dto.entity !== undefined) {
      filters.entity = dto.entity;
    }
    if (dto.entityId !== undefined && dto.entityId.trim().length > 0) {
      filters.entityId = dto.entityId.trim();
    }
    if (fechaDesde !== undefined) {
      filters.fechaDesde = fechaDesde;
    }
    if (fechaHasta !== undefined) {
      filters.fechaHasta = fechaHasta;
    }

    const result = await this.logEntryRepository.findAll(filters, limit, offset);

    this.logger.debug('Logs listados exitosamente', {
      total: result.total,
      returned: result.logs.length,
      limit,
      offset,
    });

    return result;
  }
}
