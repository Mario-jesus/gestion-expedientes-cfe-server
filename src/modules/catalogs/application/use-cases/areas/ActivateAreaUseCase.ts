import { IEventBus, ILogger } from '@shared/domain';
import { Area } from '../../../domain/entities/Area';
import { AreaNotFoundError } from '../../../domain/exceptions/AreaNotFoundError';
import { AreaActivated } from '../../../domain/events/AreaActivated';
import { IAreaRepository } from '../../../domain/ports/output/IAreaRepository';
import { IActivateAreaUseCase } from '../../ports/input/areas/IActivateAreaUseCase';

/**
 * Caso de uso para activar un área
 */
export class ActivateAreaUseCase implements IActivateAreaUseCase {
  constructor(
    private readonly areaRepository: IAreaRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param areaId - ID del área a activar
   * @param performedBy - ID del usuario que realiza la acción (opcional)
   * @returns El área activada
   * @throws AreaNotFoundError si el área no existe
   */
  async execute(areaId: string, performedBy?: string): Promise<Area> {
    this.logger.info('Ejecutando caso de uso: Activar área', {
      targetAreaId: areaId,
      performedBy,
    });

    const area = await this.areaRepository.findById(areaId);
    if (!area) {
      this.logger.warn('Intento de activar área inexistente', {
        targetAreaId: areaId,
        performedBy,
      });
      throw new AreaNotFoundError(areaId);
    }

    area.activate();

    const updatedArea = await this.areaRepository.update(area);

    await this.eventBus.publish(new AreaActivated(updatedArea, performedBy));

    this.logger.info('Área activada exitosamente', {
      targetAreaId: areaId,
      performedBy,
    });

    return updatedArea;
  }
}
