import { IEventBus, ILogger } from '@shared/domain';
import { AreaNotFoundError } from '../../../domain/exceptions/AreaNotFoundError';
import { AreaInUseError } from '../../../domain/exceptions/AreaInUseError';
import { AreaDeleted } from '../../../domain/events/AreaDeleted';
import { IAreaRepository } from '../../../domain/ports/output/IAreaRepository';
import { IDeleteAreaUseCase } from '../../ports/input/areas/IDeleteAreaUseCase';

/**
 * Caso de uso para eliminar un área
 * 
 * Reglas de negocio:
 * - No se puede eliminar si tiene colaboradores asociados
 */
export class DeleteAreaUseCase implements IDeleteAreaUseCase {
  constructor(
    private readonly areaRepository: IAreaRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param areaId - ID del área a eliminar
   * @param performedBy - ID del usuario que realiza la acción (opcional)
   * @returns true si se eliminó, false si no existía
   * @throws AreaNotFoundError si el área no existe
   * @throws AreaInUseError si el área tiene colaboradores asociados
   */
  async execute(areaId: string, performedBy?: string): Promise<boolean> {
    this.logger.info('Ejecutando caso de uso: Eliminar área', {
      targetAreaId: areaId,
      performedBy,
    });

    // Verificar que el área existe
    const area = await this.areaRepository.findById(areaId);
    if (!area) {
      this.logger.warn('Intento de eliminar área inexistente', {
        targetAreaId: areaId,
        performedBy,
      });
      throw new AreaNotFoundError(areaId);
    }

    // Verificar si tiene colaboradores asociados
    const collaboratorsCount = await this.areaRepository.countCollaboratorsByAreaId(areaId);
    if (collaboratorsCount > 0) {
      this.logger.warn('Intento de eliminar área con colaboradores asociados', {
        targetAreaId: areaId,
        collaboratorsCount,
        performedBy,
      });
      throw new AreaInUseError(areaId, 'collaborators');
    }

    // Eliminar el área (baja lógica)
    const deleted = await this.areaRepository.delete(areaId);

    if (deleted) {
      // Publicar evento de dominio solo si se eliminó correctamente
      await this.eventBus.publish(new AreaDeleted(area, performedBy));
      this.logger.info('Área eliminada exitosamente', {
        targetAreaId: areaId,
        performedBy,
      });
    }

    return deleted;
  }
}
