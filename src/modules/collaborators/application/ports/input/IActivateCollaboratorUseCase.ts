import { Collaborator } from '../../../domain/entities/Collaborator';

/**
 * Puerto de entrada (Input Port) para el caso de uso de activar colaborador
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface IActivateCollaboratorUseCase {
  /**
   * Activa un colaborador
   * @param collaboratorId - ID del colaborador a activar
   * @param performedBy - ID del usuario que realiza la acción (opcional, para auditoría)
   * @returns El colaborador activado
   * @throws CollaboratorNotFoundError si el colaborador no existe
   */
  execute(collaboratorId: string, performedBy?: string): Promise<Collaborator>;
}
