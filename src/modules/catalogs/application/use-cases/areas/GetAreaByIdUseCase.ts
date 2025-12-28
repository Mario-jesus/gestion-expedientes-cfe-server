import { ILogger } from '@shared/domain';
import { Area } from '../../../domain/entities/Area';
import { AreaNotFoundError } from '../../../domain/exceptions/AreaNotFoundError';
import { IAreaRepository } from '../../../domain/ports/output/IAreaRepository';
import { IGetAreaByIdUseCase } from '../../ports/input/areas/IGetAreaByIdUseCase';

/**
 * Caso de uso para obtener un área por su ID
 */
export class GetAreaByIdUseCase implements IGetAreaByIdUseCase {
  constructor(
    private readonly areaRepository: IAreaRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID del área a buscar
   * @returns El área encontrada
   * @throws AreaNotFoundError si el área no existe
   */
  async execute(id: string): Promise<Area> {
    this.logger.debug('Ejecutando caso de uso: Obtener área por ID', {
      areaId: id,
    });

    const area = await this.areaRepository.findById(id);

    if (!area) {
      this.logger.warn('Intento de obtener área inexistente', {
        areaId: id,
      });
      throw new AreaNotFoundError(id);
    }

    this.logger.debug('Área obtenida exitosamente', {
      areaId: id,
      nombre: area.nombre,
    });

    return area;
  }
}
