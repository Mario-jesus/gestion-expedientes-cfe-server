import { IEventBus, ILogger } from '@shared/domain';
import { Puesto } from '../../../domain/entities/Puesto';
import { PuestoNotFoundError } from '../../../domain/exceptions/PuestoNotFoundError';
import { DuplicatePuestoError } from '../../../domain/exceptions/DuplicatePuestoError';
import { PuestoUpdated } from '../../../domain/events/PuestoUpdated';
import { IPuestoRepository } from '../../../domain/ports/output/IPuestoRepository';
import { IUpdatePuestoUseCase } from '../../ports/input/puestos/IUpdatePuestoUseCase';
import { UpdatePuestoDTO } from '../../dto/puestos/UpdatePuestoDTO';

/**
 * Caso de uso para actualizar un puesto existente
 */
export class UpdatePuestoUseCase implements IUpdatePuestoUseCase {
  constructor(
    private readonly puestoRepository: IPuestoRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(
    puestoId: string,
    dto: UpdatePuestoDTO,
    performedBy?: string
  ): Promise<Puesto> {
    this.logger.info('Ejecutando caso de uso: Actualizar puesto', {
      targetPuestoId: puestoId,
      performedBy,
      fieldsToUpdate: {
        nombre: dto.nombre !== undefined,
        descripcion: dto.descripcion !== undefined,
        isActive: dto.isActive !== undefined,
      },
    });

    // Obtener el puesto existente
    const puesto = await this.puestoRepository.findById(puestoId);
    if (!puesto) {
      this.logger.warn('Intento de actualizar puesto inexistente', {
        targetPuestoId: puestoId,
        performedBy,
      });
      throw new PuestoNotFoundError(puestoId);
    }

    // Validar nombre único si se está actualizando
    if (dto.nombre !== undefined && dto.nombre !== puesto.nombre) {
      const nombreExists = await this.puestoRepository.existsByNombre(dto.nombre);
      if (nombreExists) {
        this.logger.warn('Intento de actualizar puesto con nombre duplicado', {
          targetPuestoId: puestoId,
          nombre: dto.nombre,
          performedBy,
        });
        throw new DuplicatePuestoError(dto.nombre);
      }
      puesto.updateNombre(dto.nombre);
    }

    // Actualizar descripción si se proporciona
    if (dto.descripcion !== undefined) {
      puesto.updateDescripcion(dto.descripcion);
    }

    // Actualizar estado si se proporciona
    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        puesto.activate();
      } else {
        puesto.deactivate();
      }
    }

    // Persistir los cambios
    const updatedPuesto = await this.puestoRepository.update(puesto);

    // Publicar evento de dominio
    await this.eventBus.publish(new PuestoUpdated(updatedPuesto, performedBy));

    this.logger.info('Puesto actualizado exitosamente', {
      targetPuestoId: puestoId,
      performedBy,
    });

    return updatedPuesto;
  }
}
