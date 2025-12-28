import { IEventBus, ILogger } from '@shared/domain';
import { PuestoNotFoundError } from '../../../domain/exceptions/PuestoNotFoundError';
import { PuestoInUseError } from '../../../domain/exceptions/PuestoInUseError';
import { PuestoDeleted } from '../../../domain/events/PuestoDeleted';
import { IPuestoRepository } from '../../../domain/ports/output/IPuestoRepository';
import { IDeletePuestoUseCase } from '../../ports/input/puestos/IDeletePuestoUseCase';

/**
 * Caso de uso para eliminar un puesto
 * 
 * Reglas de negocio:
 * - No se puede eliminar si tiene colaboradores asociados
 */
export class DeletePuestoUseCase implements IDeletePuestoUseCase {
  constructor(
    private readonly puestoRepository: IPuestoRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(puestoId: string, performedBy?: string): Promise<boolean> {
    this.logger.info('Ejecutando caso de uso: Eliminar puesto', {
      targetPuestoId: puestoId,
      performedBy,
    });

    // Verificar que el puesto existe
    const puesto = await this.puestoRepository.findById(puestoId);
    if (!puesto) {
      this.logger.warn('Intento de eliminar puesto inexistente', {
        targetPuestoId: puestoId,
        performedBy,
      });
      throw new PuestoNotFoundError(puestoId);
    }

    // Verificar si tiene colaboradores asociados
    const collaboratorsCount = await this.puestoRepository.countCollaboratorsByPuestoId(puestoId);
    if (collaboratorsCount > 0) {
      this.logger.warn('Intento de eliminar puesto con colaboradores asociados', {
        targetPuestoId: puestoId,
        collaboratorsCount,
        performedBy,
      });
      throw new PuestoInUseError(puestoId);
    }

    // Eliminar el puesto (baja lógica)
    const deleted = await this.puestoRepository.delete(puestoId);

    if (deleted) {
      // Publicar evento de dominio solo si se eliminó correctamente
      await this.eventBus.publish(new PuestoDeleted(puesto, performedBy));
      this.logger.info('Puesto eliminado exitosamente', {
        targetPuestoId: puestoId,
        performedBy,
      });
    }

    return deleted;
  }
}
