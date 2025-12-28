import { IEventBus, ILogger } from '@shared/domain';
import { Puesto } from '../../../domain/entities/Puesto';
import { PuestoNotFoundError } from '../../../domain/exceptions/PuestoNotFoundError';
import { PuestoDeactivated } from '../../../domain/events/PuestoDeactivated';
import { IPuestoRepository } from '../../../domain/ports/output/IPuestoRepository';
import { IDeactivatePuestoUseCase } from '../../ports/input/puestos/IDeactivatePuestoUseCase';

/**
 * Caso de uso para desactivar un puesto
 */
export class DeactivatePuestoUseCase implements IDeactivatePuestoUseCase {
  constructor(
    private readonly puestoRepository: IPuestoRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(puestoId: string, performedBy?: string): Promise<Puesto> {
    this.logger.info('Ejecutando caso de uso: Desactivar puesto', {
      targetPuestoId: puestoId,
      performedBy,
    });

    const puesto = await this.puestoRepository.findById(puestoId);
    if (!puesto) {
      this.logger.warn('Intento de desactivar puesto inexistente', {
        targetPuestoId: puestoId,
        performedBy,
      });
      throw new PuestoNotFoundError(puestoId);
    }

    puesto.deactivate();

    const updatedPuesto = await this.puestoRepository.update(puesto);

    await this.eventBus.publish(new PuestoDeactivated(updatedPuesto, performedBy));

    this.logger.info('Puesto desactivado exitosamente', {
      targetPuestoId: puestoId,
      performedBy,
    });

    return updatedPuesto;
  }
}
