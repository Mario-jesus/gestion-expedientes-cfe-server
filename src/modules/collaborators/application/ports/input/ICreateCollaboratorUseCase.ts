import { Collaborator } from '../../../domain/entities/Collaborator';
import { CreateCollaboratorDTO } from '../../dto/CreateCollaboratorDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de crear colaborador
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface ICreateCollaboratorUseCase {
  /**
   * Crea un nuevo colaborador en el sistema
   * @param dto - DTO con los datos del colaborador a crear
   * @param createdBy - ID del usuario que está creando este colaborador (opcional, para audit)
   * @returns El colaborador creado
   * @throws DuplicateCollaboratorError si el RPE ya existe
   * @note El parámetro createdBy también se usa como performedBy en el evento CollaboratorCreated
   */
  execute(dto: CreateCollaboratorDTO, createdBy?: string): Promise<Collaborator>;
}
