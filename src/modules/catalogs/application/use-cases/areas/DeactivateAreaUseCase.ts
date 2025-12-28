import { IEventBus, ILogger } from '@shared/domain';
import { Area } from '../../../domain/entities/Area';
import { AreaNotFoundError } from '../../../domain/exceptions/AreaNotFoundError';
import { AreaDeactivated } from '../../../domain/events/AreaDeactivated';
import { IAreaRepository } from '../../../domain/ports/output/IAreaRepository';
import { IDeactivateAreaUseCase } from '../../ports/input/areas/IDeactivateAreaUseCase';

/**
 * Caso de uso para desactivar un área
 */
export class DeactivateAreaUseCase implements IDeactivateAreaUseCase {
  constructor(
    private readonly areaRepository: IAreaRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param areaId - ID del área a desactivar
   * @param performedBy - ID del usuario que realiza la acción (opcional)
   * @returns El área desactivada
   * @throws AreaNotFoundError si el área no existe
   */
  async execute(areaId: string, performedBy?: string): Promise<Area> {
    this.logger.info('Ejecutando caso de uso: Desactivar área', {
      targetAreaId: areaId,
      performedBy,
    });

    const area = await this.areaRepository.findById(areaId);
    if (!area) {
      this.logger.warn('Intento de desactivar área inexistente', {
        targetAreaId: areaId,
        performedBy,
      });
      throw new AreaNotFoundError(areaId);
    }

    area.deactivate();

    const updatedArea = await this.areaRepository.update(area);

    await this.eventBus.publish(new AreaDeactivated(updatedArea, performedBy));

    this.logger.info('Área desactivada exitosamente', {
      targetAreaId: areaId,
      performedBy,
    });

    return updatedArea;
  }
}
