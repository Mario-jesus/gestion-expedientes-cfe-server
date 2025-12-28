import { Collaborator } from '../../../domain/entities/Collaborator';

/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener colaborador por ID
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface IGetCollaboratorByIdUseCase {
  /**
   * Obtiene un colaborador por su ID
   * @param id - ID del colaborador a buscar
   * @returns El colaborador encontrado
   * @throws CollaboratorNotFoundError si el colaborador no existe
   */
  execute(id: string): Promise<Collaborator>;
}
