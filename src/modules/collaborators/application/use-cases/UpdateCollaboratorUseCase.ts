import { IEventBus, ILogger } from '@shared/domain';
import { Collaborator } from '../../domain';
import { CollaboratorNotFoundError } from '../../domain/exceptions/CollaboratorNotFoundError';
import { CollaboratorUpdated } from '../../domain/events/CollaboratorUpdated';
import { ICollaboratorRepository } from '../../domain/ports/output/ICollaboratorRepository';
import { IUpdateCollaboratorUseCase } from '../ports/input/IUpdateCollaboratorUseCase';
import { UpdateCollaboratorDTO } from '../dto/UpdateCollaboratorDTO';

/**
 * Caso de uso para actualizar un colaborador existente
 * 
 * Se encarga de:
 * - Validar que el colaborador exista
 * - Actualizar las propiedades del colaborador usando métodos de la entidad
 * - Persistir los cambios
 * - Publicar eventos de dominio
 */
export class UpdateCollaboratorUseCase implements IUpdateCollaboratorUseCase {
  constructor(
    private readonly collaboratorRepository: ICollaboratorRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param collaboratorId - ID del colaborador a actualizar
   * @param dto - DTO con los campos a actualizar (actualización parcial)
   * @param performedBy - ID del usuario que realiza la acción (opcional, para auditoría)
   * @returns El colaborador actualizado
   * @throws CollaboratorNotFoundError si el colaborador no existe
   */
  async execute(
    collaboratorId: string,
    dto: UpdateCollaboratorDTO,
    performedBy?: string
  ): Promise<Collaborator> {
    this.logger.info('Ejecutando caso de uso: Actualizar colaborador', {
      targetCollaboratorId: collaboratorId,
      performedBy,
      fieldsToUpdate: {
        nombre: dto.nombre !== undefined,
        apellidos: dto.apellidos !== undefined,
        rtt: dto.rtt !== undefined,
        areaId: dto.areaId !== undefined,
        adscripcionId: dto.adscripcionId !== undefined,
        puestoId: dto.puestoId !== undefined,
        tipoContrato: dto.tipoContrato !== undefined,
        rfc: dto.rfc !== undefined,
        curp: dto.curp !== undefined,
        imss: dto.imss !== undefined,
        isActive: dto.isActive !== undefined,
      },
    });

    // Obtener el colaborador existente
    const collaborator = await this.collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      this.logger.warn('Intento de actualizar colaborador inexistente', {
        targetCollaboratorId: collaboratorId,
        performedBy,
      });
      throw new CollaboratorNotFoundError(collaboratorId);
    }

    // Actualizar campos según el DTO
    if (dto.nombre !== undefined && dto.nombre !== collaborator.nombre) {
      collaborator.updateNombre(dto.nombre);
    }

    if (dto.apellidos !== undefined && dto.apellidos !== collaborator.apellidos) {
      collaborator.updateApellidos(dto.apellidos);
    }

    if (dto.rtt !== undefined) {
      collaborator.updateRTT(dto.rtt);
    }

    if (dto.areaId !== undefined && dto.areaId !== collaborator.areaId) {
      collaborator.updateAreaId(dto.areaId);
    }

    if (dto.adscripcionId !== undefined && dto.adscripcionId !== collaborator.adscripcionId) {
      collaborator.updateAdscripcionId(dto.adscripcionId);
    }

    if (dto.puestoId !== undefined && dto.puestoId !== collaborator.puestoId) {
      collaborator.updatePuestoId(dto.puestoId);
    }

    if (dto.tipoContrato !== undefined && dto.tipoContrato !== collaborator.tipoContrato) {
      collaborator.updateTipoContrato(dto.tipoContrato);
    }

    if (dto.rfc !== undefined && dto.rfc !== collaborator.rfcValue) {
      collaborator.updateRFC(dto.rfc);
    }

    if (dto.curp !== undefined && dto.curp !== collaborator.curpValue) {
      collaborator.updateCURP(dto.curp);
    }

    if (dto.imss !== undefined && dto.imss !== collaborator.imssValue) {
      collaborator.updateIMSS(dto.imss);
    }

    if (dto.isActive !== undefined && dto.isActive !== collaborator.isActive) {
      if (dto.isActive) {
        collaborator.activate();
      } else {
        collaborator.deactivate();
      }
    }

    // Persistir los cambios
    const updatedCollaborator = await this.collaboratorRepository.update(collaborator);

    // Publicar evento de dominio
    await this.eventBus.publish(new CollaboratorUpdated(updatedCollaborator, performedBy));

    this.logger.info('Colaborador actualizado exitosamente', {
      targetCollaboratorId: collaboratorId,
      performedBy,
    });

    return updatedCollaborator;
  }
}
