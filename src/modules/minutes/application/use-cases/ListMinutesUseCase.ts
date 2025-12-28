import { ILogger } from '@shared/domain';
import { Minute } from '../../domain';
import { IMinuteRepository } from '../../domain/ports/output/IMinuteRepository';
import { IListMinutesUseCase } from '../ports/input/IListMinutesUseCase';
import { ListMinutesFiltersDTO } from '../dto/ListMinutesFiltersDTO';

/**
 * Caso de uso para listar minutas con filtros y paginación
 * 
 * Se encarga de:
 * - Aplicar filtros opcionales (tipo, isActive, fechaDesde, fechaHasta, search)
 * - Aplicar paginación (limit, offset)
 * - Retornar lista de minutas y total de resultados
 */
export class ListMinutesUseCase implements IListMinutesUseCase {
  constructor(
    private readonly minuteRepository: IMinuteRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con filtros y parámetros de paginación
   * @returns Lista de minutas y total de resultados
   */
  async execute(dto: ListMinutesFiltersDTO): Promise<{ minutes: Minute[]; total: number }> {
    const limit = dto.limit ?? 20; // Default: 20
    const offset = dto.offset ?? 0; // Default: 0

    this.logger.debug('Ejecutando caso de uso: Listar minutas', {
      filters: {
        tipo: dto.tipo,
        isActive: dto.isActive,
        fechaDesde: dto.fechaDesde,
        fechaHasta: dto.fechaHasta,
        search: dto.search,
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
      tipo?: typeof dto.tipo;
      isActive?: boolean;
      fechaDesde?: Date;
      fechaHasta?: Date;
      search?: string;
    } = {};

    if (dto.tipo !== undefined) {
      filters.tipo = dto.tipo;
    }
    if (dto.isActive !== undefined) {
      filters.isActive = dto.isActive;
    }
    if (fechaDesde !== undefined) {
      filters.fechaDesde = fechaDesde;
    }
    if (fechaHasta !== undefined) {
      filters.fechaHasta = fechaHasta;
    }
    if (dto.search !== undefined && dto.search.trim().length > 0) {
      filters.search = dto.search.trim();
    }

    const result = await this.minuteRepository.findAll(filters, limit, offset);

    this.logger.debug('Minutas listadas exitosamente', {
      total: result.total,
      returned: result.minutes.length,
      limit,
      offset,
    });

    return result;
  }
}
