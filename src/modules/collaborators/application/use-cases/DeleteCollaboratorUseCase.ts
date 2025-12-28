import { IEventBus, ILogger } from '@shared/domain';
import { CollaboratorNotFoundError } from '../../domain/exceptions/CollaboratorNotFoundError';
import { CollaboratorDeleted } from '../../domain/events/CollaboratorDeleted';
import { ICollaboratorRepository } from '../../domain/ports/output/ICollaboratorRepository';
import { IDeleteCollaboratorUseCase } from '../ports/input/IDeleteCollaboratorUseCase';

/**
 * Caso de uso para eliminar un colaborador
 * 
 * Se encarga de:
 * - Validar que el colaborador exista
 * - Eliminar el colaborador (baja lógica)
 * - Publicar eventos de dominio (CollaboratorDeleted)
 */
export class DeleteCollaboratorUseCase implements IDeleteCollaboratorUseCase {
  constructor(
    private readonly collaboratorRepository: ICollaboratorRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param collaboratorId - ID del colaborador a eliminar
   * @param performedBy - ID del usuario que realiza la acción (opcional, para auditoría)
   * @returns true si se eliminó, false si no existía
   * @throws CollaboratorNotFoundError si el colaborador no existe
   */
  async execute(collaboratorId: string, performedBy?: string): Promise<boolean> {
    this.logger.info('Ejecutando caso de uso: Eliminar colaborador', {
      targetCollaboratorId: collaboratorId,
      performedBy,
    });

    // Verificar que el colaborador existe antes de eliminarlo
    const collaborator = await this.collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      this.logger.warn('Intento de eliminar colaborador inexistente', {
        targetCollaboratorId: collaboratorId,
        performedBy,
      });
      throw new CollaboratorNotFoundError(collaboratorId);
    }

    // Eliminar el colaborador (baja lógica)
    const deleted = await this.collaboratorRepository.delete(collaboratorId);

    if (deleted) {
      // Publicar evento de dominio solo si se eliminó correctamente
      await this.eventBus.publish(new CollaboratorDeleted(collaborator, performedBy));
      this.logger.info('Colaborador eliminado exitosamente', {
        targetCollaboratorId: collaboratorId,
        performedBy,
      });
    }

    return deleted;
  }
}
