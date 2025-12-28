import { IEventBus, ILogger } from '@shared/domain';
import { Adscripcion } from '../../../domain/entities/Adscripcion';
import { AdscripcionNotFoundError } from '../../../domain/exceptions/AdscripcionNotFoundError';
import { AdscripcionActivated } from '../../../domain/events/AdscripcionActivated';
import { IAdscripcionRepository } from '../../../domain/ports/output/IAdscripcionRepository';
import { IActivateAdscripcionUseCase } from '../../ports/input/adscripciones/IActivateAdscripcionUseCase';

/**
 * Caso de uso para activar una adscripción
 */
export class ActivateAdscripcionUseCase implements IActivateAdscripcionUseCase {
  constructor(
    private readonly adscripcionRepository: IAdscripcionRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(adscripcionId: string, performedBy?: string): Promise<Adscripcion> {
    this.logger.info('Ejecutando caso de uso: Activar adscripción', {
      targetAdscripcionId: adscripcionId,
      performedBy,
    });

    const adscripcion = await this.adscripcionRepository.findById(adscripcionId);
    if (!adscripcion) {
      this.logger.warn('Intento de activar adscripción inexistente', {
        targetAdscripcionId: adscripcionId,
        performedBy,
      });
      throw new AdscripcionNotFoundError(adscripcionId);
    }

    adscripcion.activate();

    const updatedAdscripcion = await this.adscripcionRepository.update(adscripcion);

    await this.eventBus.publish(new AdscripcionActivated(updatedAdscripcion, performedBy));

    this.logger.info('Adscripción activada exitosamente', {
      targetAdscripcionId: adscripcionId,
      performedBy,
    });

    return updatedAdscripcion;
  }
}
