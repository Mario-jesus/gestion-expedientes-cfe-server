import { IEventBus, ILogger } from '@shared/domain';
import { Puesto } from '../../../domain/entities/Puesto';
import { PuestoNotFoundError } from '../../../domain/exceptions/PuestoNotFoundError';
import { PuestoActivated } from '../../../domain/events/PuestoActivated';
import { IPuestoRepository } from '../../../domain/ports/output/IPuestoRepository';
import { IActivatePuestoUseCase } from '../../ports/input/puestos/IActivatePuestoUseCase';

/**
 * Caso de uso para activar un puesto
 */
export class ActivatePuestoUseCase implements IActivatePuestoUseCase {
  constructor(
    private readonly puestoRepository: IPuestoRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(puestoId: string, performedBy?: string): Promise<Puesto> {
    this.logger.info('Ejecutando caso de uso: Activar puesto', {
      targetPuestoId: puestoId,
      performedBy,
    });

    const puesto = await this.puestoRepository.findById(puestoId);
    if (!puesto) {
      this.logger.warn('Intento de activar puesto inexistente', {
        targetPuestoId: puestoId,
        performedBy,
      });
      throw new PuestoNotFoundError(puestoId);
    }

    puesto.activate();

    const updatedPuesto = await this.puestoRepository.update(puesto);

    await this.eventBus.publish(new PuestoActivated(updatedPuesto, performedBy));

    this.logger.info('Puesto activado exitosamente', {
      targetPuestoId: puestoId,
      performedBy,
    });

    return updatedPuesto;
  }
}
