import { IEventBus, ILogger } from '@shared/domain';
import { Adscripcion } from '../../../domain/entities/Adscripcion';
import { AdscripcionNotFoundError } from '../../../domain/exceptions/AdscripcionNotFoundError';
import { AdscripcionDeactivated } from '../../../domain/events/AdscripcionDeactivated';
import { IAdscripcionRepository } from '../../../domain/ports/output/IAdscripcionRepository';
import { IDeactivateAdscripcionUseCase } from '../../ports/input/adscripciones/IDeactivateAdscripcionUseCase';

/**
 * Caso de uso para desactivar una adscripción
 */
export class DeactivateAdscripcionUseCase implements IDeactivateAdscripcionUseCase {
  constructor(
    private readonly adscripcionRepository: IAdscripcionRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(adscripcionId: string, performedBy?: string): Promise<Adscripcion> {
    this.logger.info('Ejecutando caso de uso: Desactivar adscripción', {
      targetAdscripcionId: adscripcionId,
      performedBy,
    });

    const adscripcion = await this.adscripcionRepository.findById(adscripcionId);
    if (!adscripcion) {
      this.logger.warn('Intento de desactivar adscripción inexistente', {
        targetAdscripcionId: adscripcionId,
        performedBy,
      });
      throw new AdscripcionNotFoundError(adscripcionId);
    }

    adscripcion.deactivate();

    const updatedAdscripcion = await this.adscripcionRepository.update(adscripcion);

    await this.eventBus.publish(new AdscripcionDeactivated(updatedAdscripcion, performedBy));

    this.logger.info('Adscripción desactivada exitosamente', {
      targetAdscripcionId: adscripcionId,
      performedBy,
    });

    return updatedAdscripcion;
  }
}
