import { ILogger } from '@shared/domain';
import { Area } from '../../../domain/entities/Area';
import { IAreaRepository } from '../../../domain/ports/output/IAreaRepository';
import { IListAreasUseCase } from '../../ports/input/areas/IListAreasUseCase';
import { ListAreasDTO } from '../../dto/areas/ListAreasDTO';

/**
 * Caso de uso para listar áreas con filtros y paginación
 */
export class ListAreasUseCase implements IListAreasUseCase {
  constructor(
    private readonly areaRepository: IAreaRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con filtros y parámetros de paginación
   * @returns Lista de áreas y total de resultados
   */
  async execute(dto: ListAreasDTO): Promise<{ areas: Area[]; total: number }> {
    const limit = dto.limit ?? 20;
    const offset = dto.offset ?? 0;
    const sortBy = dto.sortBy ?? 'createdAt';
    const sortOrder = dto.sortOrder ?? 'desc';

    this.logger.debug('Ejecutando caso de uso: Listar áreas', {
      filters: dto.filters,
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    const result = await this.areaRepository.findAll(
      dto.filters,
      limit,
      offset,
      sortBy,
      sortOrder
    );

    this.logger.debug('Áreas listadas exitosamente', {
      total: result.total,
      returned: result.areas.length,
      limit,
      offset,
    });

    return result;
  }
}
