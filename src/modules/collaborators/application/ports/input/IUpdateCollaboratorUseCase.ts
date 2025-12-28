import { Collaborator } from '../../../domain/entities/Collaborator';
import { UpdateCollaboratorDTO } from '../../dto/UpdateCollaboratorDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de actualizar colaborador
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface IUpdateCollaboratorUseCase {
  /**
   * Actualiza un colaborador existente
   * @param collaboratorId - ID del colaborador a actualizar
   * @param dto - DTO con los campos a actualizar (actualización parcial)
   * @param performedBy - ID del usuario que realiza la acción (opcional, para auditoría)
   * @returns El colaborador actualizado
   * @throws CollaboratorNotFoundError si el colaborador no existe
   */
  execute(collaboratorId: string, dto: UpdateCollaboratorDTO, performedBy?: string): Promise<Collaborator>;
}
