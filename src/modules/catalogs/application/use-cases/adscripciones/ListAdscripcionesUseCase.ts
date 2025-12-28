import { ILogger } from '@shared/domain';
import { Adscripcion } from '../../../domain/entities/Adscripcion';
import { IAdscripcionRepository } from '../../../domain/ports/output/IAdscripcionRepository';
import { IListAdscripcionesUseCase } from '../../ports/input/adscripciones/IListAdscripcionesUseCase';
import { ListAdscripcionesDTO } from '../../dto/adscripciones/ListAdscripcionesDTO';

/**
 * Caso de uso para listar adscripciones con filtros y paginación
 */
export class ListAdscripcionesUseCase implements IListAdscripcionesUseCase {
  constructor(
    private readonly adscripcionRepository: IAdscripcionRepository,
    private readonly logger: ILogger
  ) {}

  async execute(dto: ListAdscripcionesDTO): Promise<{ adscripciones: Adscripcion[]; total: number }> {
    const limit = dto.limit ?? 20;
    const offset = dto.offset ?? 0;
    const sortBy = dto.sortBy ?? 'createdAt';
    const sortOrder = dto.sortOrder ?? 'desc';

    this.logger.debug('Ejecutando caso de uso: Listar adscripciones', {
      filters: dto.filters,
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    const result = await this.adscripcionRepository.findAll(
      dto.filters,
      limit,
      offset,
      sortBy,
      sortOrder
    );

    this.logger.debug('Adscripciones listadas exitosamente', {
      total: result.total,
      returned: result.adscripciones.length,
      limit,
      offset,
    });

    return result;
  }
}
