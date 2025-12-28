import { IEventBus, ILogger } from '@shared/domain';
import { AdscripcionNotFoundError } from '../../../domain/exceptions/AdscripcionNotFoundError';
import { AdscripcionInUseError } from '../../../domain/exceptions/AdscripcionInUseError';
import { AdscripcionDeleted } from '../../../domain/events/AdscripcionDeleted';
import { IAdscripcionRepository } from '../../../domain/ports/output/IAdscripcionRepository';
import { IDeleteAdscripcionUseCase } from '../../ports/input/adscripciones/IDeleteAdscripcionUseCase';

/**
 * Caso de uso para eliminar una adscripción
 * 
 * Reglas de negocio:
 * - No se puede eliminar si tiene colaboradores asociados
 */
export class DeleteAdscripcionUseCase implements IDeleteAdscripcionUseCase {
  constructor(
    private readonly adscripcionRepository: IAdscripcionRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(adscripcionId: string, performedBy?: string): Promise<boolean> {
    this.logger.info('Ejecutando caso de uso: Eliminar adscripción', {
      targetAdscripcionId: adscripcionId,
      performedBy,
    });

    // Verificar que la adscripción existe
    const adscripcion = await this.adscripcionRepository.findById(adscripcionId);
    if (!adscripcion) {
      this.logger.warn('Intento de eliminar adscripción inexistente', {
        targetAdscripcionId: adscripcionId,
        performedBy,
      });
      throw new AdscripcionNotFoundError(adscripcionId);
    }

    // Verificar si tiene colaboradores asociados
    const collaboratorsCount = await this.adscripcionRepository.countCollaboratorsByAdscripcionId(
      adscripcionId
    );
    if (collaboratorsCount > 0) {
      this.logger.warn('Intento de eliminar adscripción con colaboradores asociados', {
        targetAdscripcionId: adscripcionId,
        collaboratorsCount,
        performedBy,
      });
      throw new AdscripcionInUseError(adscripcionId);
    }

    // Eliminar la adscripción (baja lógica)
    const deleted = await this.adscripcionRepository.delete(adscripcionId);

    if (deleted) {
      // Publicar evento de dominio solo si se eliminó correctamente
      await this.eventBus.publish(new AdscripcionDeleted(adscripcion, performedBy));
      this.logger.info('Adscripción eliminada exitosamente', {
        targetAdscripcionId: adscripcionId,
        performedBy,
      });
    }

    return deleted;
  }
}
