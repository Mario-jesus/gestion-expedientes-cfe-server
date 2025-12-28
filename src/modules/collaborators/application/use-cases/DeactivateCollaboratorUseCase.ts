import { IEventBus, ILogger } from '@shared/domain';
import { Collaborator } from '../../domain';
import { CollaboratorNotFoundError } from '../../domain/exceptions/CollaboratorNotFoundError';
import { CollaboratorDeactivated } from '../../domain/events/CollaboratorDeactivated';
import { ICollaboratorRepository } from '../../domain/ports/output/ICollaboratorRepository';
import { IDeactivateCollaboratorUseCase } from '../ports/input/IDeactivateCollaboratorUseCase';

/**
 * Caso de uso para desactivar un colaborador
 * 
 * Se encarga de:
 * - Validar que el colaborador exista
 * - Desactivar el colaborador usando métodos de la entidad (baja lógica)
 * - Persistir los cambios
 * - Publicar eventos de dominio
 */
export class DeactivateCollaboratorUseCase implements IDeactivateCollaboratorUseCase {
  constructor(
    private readonly collaboratorRepository: ICollaboratorRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param collaboratorId - ID del colaborador a desactivar
   * @param performedBy - ID del usuario que realiza la acción (opcional, para auditoría)
   * @returns El colaborador desactivado
   * @throws CollaboratorNotFoundError si el colaborador no existe
   */
  async execute(collaboratorId: string, performedBy?: string): Promise<Collaborator> {
    this.logger.info('Ejecutando caso de uso: Desactivar colaborador', {
      targetCollaboratorId: collaboratorId,
      performedBy,
    });

    // Obtener el colaborador existente
    const collaborator = await this.collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      this.logger.warn('Intento de desactivar colaborador inexistente', {
        targetCollaboratorId: collaboratorId,
        performedBy,
      });
      throw new CollaboratorNotFoundError(collaboratorId);
    }

    // Desactivar el colaborador
    collaborator.deactivate();

    // Persistir los cambios
    const updatedCollaborator = await this.collaboratorRepository.update(collaborator);

    // Publicar evento de dominio
    await this.eventBus.publish(new CollaboratorDeactivated(updatedCollaborator, performedBy));

    this.logger.info('Colaborador desactivado exitosamente', {
      targetCollaboratorId: collaboratorId,
      performedBy,
    });

    return updatedCollaborator;
  }
}
