import { Collaborator } from '../../../domain/entities/Collaborator';
import { ListCollaboratorsDTO } from '../../dto/ListCollaboratorsDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de listar colaboradores
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface IListCollaboratorsUseCase {
  /**
   * Lista colaboradores con filtros opcionales y paginación
   * @param dto - DTO con filtros y parámetros de paginación
   * @returns Lista de colaboradores y total de resultados
   */
  execute(dto: ListCollaboratorsDTO): Promise<{ collaborators: Collaborator[]; total: number }>;
}
