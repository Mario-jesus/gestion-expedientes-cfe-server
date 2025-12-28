import { IEventBus, ILogger } from '@shared/domain';
import { Collaborator } from '../../domain';
import { CollaboratorNotFoundError } from '../../domain/exceptions/CollaboratorNotFoundError';
import { CollaboratorActivated } from '../../domain/events/CollaboratorActivated';
import { ICollaboratorRepository } from '../../domain/ports/output/ICollaboratorRepository';
import { IActivateCollaboratorUseCase } from '../ports/input/IActivateCollaboratorUseCase';

/**
 * Caso de uso para activar un colaborador
 * 
 * Se encarga de:
 * - Validar que el colaborador exista
 * - Activar el colaborador usando métodos de la entidad
 * - Persistir los cambios
 * - Publicar eventos de dominio
 */
export class ActivateCollaboratorUseCase implements IActivateCollaboratorUseCase {
  constructor(
    private readonly collaboratorRepository: ICollaboratorRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param collaboratorId - ID del colaborador a activar
   * @param performedBy - ID del usuario que realiza la acción (opcional, para auditoría)
   * @returns El colaborador activado
   * @throws CollaboratorNotFoundError si el colaborador no existe
   */
  async execute(collaboratorId: string, performedBy?: string): Promise<Collaborator> {
    this.logger.info('Ejecutando caso de uso: Activar colaborador', {
      targetCollaboratorId: collaboratorId,
      performedBy,
    });

    // Obtener el colaborador existente
    const collaborator = await this.collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      this.logger.warn('Intento de activar colaborador inexistente', {
        targetCollaboratorId: collaboratorId,
        performedBy,
      });
      throw new CollaboratorNotFoundError(collaboratorId);
    }

    // Activar el colaborador
    collaborator.activate();

    // Persistir los cambios
    const updatedCollaborator = await this.collaboratorRepository.update(collaborator);

    // Publicar evento de dominio
    await this.eventBus.publish(new CollaboratorActivated(updatedCollaborator, performedBy));

    this.logger.info('Colaborador activado exitosamente', {
      targetCollaboratorId: collaboratorId,
      performedBy,
    });

    return updatedCollaborator;
  }
}
