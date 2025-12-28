import { IEventBus, ILogger } from '@shared/domain';
import { Adscripcion } from '../../../domain/entities/Adscripcion';
import { AdscripcionNotFoundError } from '../../../domain/exceptions/AdscripcionNotFoundError';
import { AreaNotFoundError } from '../../../domain/exceptions/AreaNotFoundError';
import { DuplicateAdscripcionError } from '../../../domain/exceptions/DuplicateAdscripcionError';
import { AdscripcionUpdated } from '../../../domain/events/AdscripcionUpdated';
import { IAdscripcionRepository } from '../../../domain/ports/output/IAdscripcionRepository';
import { IAreaRepository } from '../../../domain/ports/output/IAreaRepository';
import { IUpdateAdscripcionUseCase } from '../../ports/input/adscripciones/IUpdateAdscripcionUseCase';
import { UpdateAdscripcionDTO } from '../../dto/adscripciones/UpdateAdscripcionDTO';

/**
 * Caso de uso para actualizar una adscripción existente
 */
export class UpdateAdscripcionUseCase implements IUpdateAdscripcionUseCase {
  constructor(
    private readonly adscripcionRepository: IAdscripcionRepository,
    private readonly areaRepository: IAreaRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(
    adscripcionId: string,
    dto: UpdateAdscripcionDTO,
    performedBy?: string
  ): Promise<Adscripcion> {
    this.logger.info('Ejecutando caso de uso: Actualizar adscripción', {
      targetAdscripcionId: adscripcionId,
      performedBy,
      fieldsToUpdate: {
        nombre: dto.nombre !== undefined,
        areaId: dto.areaId !== undefined,
        descripcion: dto.descripcion !== undefined,
        isActive: dto.isActive !== undefined,
      },
    });

    // Obtener la adscripción existente
    const adscripcion = await this.adscripcionRepository.findById(adscripcionId);
    if (!adscripcion) {
      this.logger.warn('Intento de actualizar adscripción inexistente', {
        targetAdscripcionId: adscripcionId,
        performedBy,
      });
      throw new AdscripcionNotFoundError(adscripcionId);
    }

    // Validar área si se está actualizando
    const areaIdToUse = dto.areaId ?? adscripcion.areaId;
    if (dto.areaId !== undefined && dto.areaId !== adscripcion.areaId) {
      const area = await this.areaRepository.findById(dto.areaId);
      if (!area) {
        this.logger.warn('Intento de actualizar adscripción con área inexistente', {
          targetAdscripcionId: adscripcionId,
          areaId: dto.areaId,
          performedBy,
        });
        throw new AreaNotFoundError(dto.areaId);
      }
    }

    // Validar nombre único si se está actualizando
    if (dto.nombre !== undefined && dto.nombre !== adscripcion.nombre) {
      const nombreExists = await this.adscripcionRepository.existsByNombreAndAreaId(
        dto.nombre,
        areaIdToUse
      );
      if (nombreExists) {
        this.logger.warn('Intento de actualizar adscripción con nombre duplicado', {
          targetAdscripcionId: adscripcionId,
          nombre: dto.nombre,
          areaId: areaIdToUse,
          performedBy,
        });
        throw new DuplicateAdscripcionError(dto.nombre, areaIdToUse);
      }
      adscripcion.updateNombre(dto.nombre);
    }

    // Actualizar área si se proporciona
    if (dto.areaId !== undefined && dto.areaId !== adscripcion.areaId) {
      adscripcion.updateAreaId(dto.areaId);
    }

    // Actualizar descripción si se proporciona
    if (dto.descripcion !== undefined) {
      adscripcion.updateDescripcion(dto.descripcion);
    }

    // Actualizar estado si se proporciona
    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        adscripcion.activate();
      } else {
        adscripcion.deactivate();
      }
    }

    // Persistir los cambios
    const updatedAdscripcion = await this.adscripcionRepository.update(adscripcion);

    // Publicar evento de dominio
    await this.eventBus.publish(new AdscripcionUpdated(updatedAdscripcion, performedBy));

    this.logger.info('Adscripción actualizada exitosamente', {
      targetAdscripcionId: adscripcionId,
      performedBy,
    });

    return updatedAdscripcion;
  }
}
