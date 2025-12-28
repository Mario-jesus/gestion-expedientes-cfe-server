import { IEventBus, ILogger } from '@shared/domain';
import { Area } from '../../../domain/entities/Area';
import { AreaNotFoundError } from '../../../domain/exceptions/AreaNotFoundError';
import { DuplicateAreaError } from '../../../domain/exceptions/DuplicateAreaError';
import { AreaUpdated } from '../../../domain/events/AreaUpdated';
import { IAreaRepository } from '../../../domain/ports/output/IAreaRepository';
import { IUpdateAreaUseCase } from '../../ports/input/areas/IUpdateAreaUseCase';
import { UpdateAreaDTO } from '../../dto/areas/UpdateAreaDTO';

/**
 * Caso de uso para actualizar un área existente
 */
export class UpdateAreaUseCase implements IUpdateAreaUseCase {
  constructor(
    private readonly areaRepository: IAreaRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param areaId - ID del área a actualizar
   * @param dto - DTO con los campos a actualizar
   * @param performedBy - ID del usuario que realiza la acción (opcional)
   * @returns El área actualizada
   * @throws AreaNotFoundError si el área no existe
   * @throws DuplicateAreaError si el nuevo nombre ya existe
   */
  async execute(
    areaId: string,
    dto: UpdateAreaDTO,
    performedBy?: string
  ): Promise<Area> {
    this.logger.info('Ejecutando caso de uso: Actualizar área', {
      targetAreaId: areaId,
      performedBy,
      fieldsToUpdate: {
        nombre: dto.nombre !== undefined,
        descripcion: dto.descripcion !== undefined,
        isActive: dto.isActive !== undefined,
      },
    });

    // Obtener el área existente
    const area = await this.areaRepository.findById(areaId);
    if (!area) {
      this.logger.warn('Intento de actualizar área inexistente', {
        targetAreaId: areaId,
        performedBy,
      });
      throw new AreaNotFoundError(areaId);
    }

    // Validar nombre único si se está actualizando
    if (dto.nombre !== undefined && dto.nombre !== area.nombre) {
      const nombreExists = await this.areaRepository.existsByNombre(dto.nombre);
      if (nombreExists) {
        this.logger.warn('Intento de actualizar área con nombre duplicado', {
          targetAreaId: areaId,
          nombre: dto.nombre,
          performedBy,
        });
        throw new DuplicateAreaError(dto.nombre);
      }
      area.updateNombre(dto.nombre);
    }

    // Actualizar descripción si se proporciona
    if (dto.descripcion !== undefined) {
      area.updateDescripcion(dto.descripcion);
    }

    // Actualizar estado si se proporciona
    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        area.activate();
      } else {
        area.deactivate();
      }
    }

    // Persistir los cambios
    const updatedArea = await this.areaRepository.update(area);

    // Publicar evento de dominio
    await this.eventBus.publish(new AreaUpdated(updatedArea, performedBy));

    this.logger.info('Área actualizada exitosamente', {
      targetAreaId: areaId,
      performedBy,
    });

    return updatedArea;
  }
}
