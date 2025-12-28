import { ILogger } from '@shared/domain';
import { Puesto } from '../../../domain/entities/Puesto';
import { IPuestoRepository } from '../../../domain/ports/output/IPuestoRepository';
import { IListPuestosUseCase } from '../../ports/input/puestos/IListPuestosUseCase';
import { ListPuestosDTO } from '../../dto/puestos/ListPuestosDTO';

/**
 * Caso de uso para listar puestos con filtros y paginación
 */
export class ListPuestosUseCase implements IListPuestosUseCase {
  constructor(
    private readonly puestoRepository: IPuestoRepository,
    private readonly logger: ILogger
  ) {}

  async execute(dto: ListPuestosDTO): Promise<{ puestos: Puesto[]; total: number }> {
    const limit = dto.limit ?? 20;
    const offset = dto.offset ?? 0;
    const sortBy = dto.sortBy ?? 'createdAt';
    const sortOrder = dto.sortOrder ?? 'desc';

    this.logger.debug('Ejecutando caso de uso: Listar puestos', {
      filters: dto.filters,
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    const result = await this.puestoRepository.findAll(
      dto.filters,
      limit,
      offset,
      sortBy,
      sortOrder
    );

    this.logger.debug('Puestos listados exitosamente', {
      total: result.total,
      returned: result.puestos.length,
      limit,
      offset,
    });

    return result;
  }
}
