import { ILogger } from '@shared/domain';
import { Puesto } from '../../../domain/entities/Puesto';
import { PuestoNotFoundError } from '../../../domain/exceptions/PuestoNotFoundError';
import { IPuestoRepository } from '../../../domain/ports/output/IPuestoRepository';
import { IGetPuestoByIdUseCase } from '../../ports/input/puestos/IGetPuestoByIdUseCase';

/**
 * Caso de uso para obtener un puesto por su ID
 */
export class GetPuestoByIdUseCase implements IGetPuestoByIdUseCase {
  constructor(
    private readonly puestoRepository: IPuestoRepository,
    private readonly logger: ILogger
  ) {}

  async execute(id: string): Promise<Puesto> {
    this.logger.debug('Ejecutando caso de uso: Obtener puesto por ID', {
      puestoId: id,
    });

    const puesto = await this.puestoRepository.findById(id);

    if (!puesto) {
      this.logger.warn('Intento de obtener puesto inexistente', {
        puestoId: id,
      });
      throw new PuestoNotFoundError(id);
    }

    this.logger.debug('Puesto obtenido exitosamente', {
      puestoId: id,
      nombre: puesto.nombre,
    });

    return puesto;
  }
}
