import { IEventBus, ILogger } from '@shared/domain';
import { Adscripcion } from '../../../domain/entities/Adscripcion';
import { AdscripcionNotFoundError } from '../../../domain/exceptions/AdscripcionNotFoundError';
import { DuplicateAdscripcionError } from '../../../domain/exceptions/DuplicateAdscripcionError';
import { AdscripcionUpdated } from '../../../domain/events/AdscripcionUpdated';
import { IAdscripcionRepository } from '../../../domain/ports/output/IAdscripcionRepository';
import { IUpdateAdscripcionUseCase } from '../../ports/input/adscripciones/IUpdateAdscripcionUseCase';
import { UpdateAdscripcionDTO } from '../../dto/adscripciones/UpdateAdscripcionDTO';

/**
 * Caso de uso para actualizar una adscripción existente
 */
export class UpdateAdscripcionUseCase implements IUpdateAdscripcionUseCase {
  constructor(
    private readonly adscripcionRepository: IAdscripcionRepository,
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
        adscripcion: dto.adscripcion !== undefined,
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

    // Actualizar nombre si se proporciona (no hay restricción de unicidad para nombre)
    if (dto.nombre !== undefined && dto.nombre !== adscripcion.nombre) {
      adscripcion.updateNombre(dto.nombre);
    }

    // Validar adscripcion único si se está actualizando
    if (dto.adscripcion !== undefined && dto.adscripcion !== adscripcion.adscripcion) {
      const adscripcionExists = await this.adscripcionRepository.existsByAdscripcion(dto.adscripcion);
      if (adscripcionExists) {
        this.logger.warn('Intento de actualizar adscripción con valor duplicado', {
          targetAdscripcionId: adscripcionId,
          adscripcion: dto.adscripcion,
          performedBy,
        });
        throw new DuplicateAdscripcionError(dto.adscripcion);
      }
      adscripcion.updateAdscripcion(dto.adscripcion);
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
