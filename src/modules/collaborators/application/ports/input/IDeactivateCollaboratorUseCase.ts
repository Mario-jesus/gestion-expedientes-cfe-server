import { Collaborator } from '../../../domain/entities/Collaborator';

/**
 * Puerto de entrada (Input Port) para el caso de uso de desactivar colaborador
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface IDeactivateCollaboratorUseCase {
  /**
   * Desactiva un colaborador (baja lógica)
   * @param collaboratorId - ID del colaborador a desactivar
   * @param performedBy - ID del usuario que realiza la acción (opcional, para auditoría)
   * @returns El colaborador desactivado
   * @throws CollaboratorNotFoundError si el colaborador no existe
   */
  execute(collaboratorId: string, performedBy?: string): Promise<Collaborator>;
}
