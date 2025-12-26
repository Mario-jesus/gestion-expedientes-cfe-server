import { User } from '../../../domain/entities/User';
import { ListUsersDTO } from '../../dto/ListUsersDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de listar usuarios
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface IListUsersUseCase {
  /**
   * Lista usuarios con filtros opcionales y paginación
   * @param dto - DTO con filtros y parámetros de paginación
   * @param performedBy - ID del usuario que realiza la acción (para autorización)
   * @returns Lista de usuarios y total de resultados
   * @throws ForbiddenError si el usuario no tiene permisos para listar usuarios
   */
  execute(dto: ListUsersDTO, performedBy?: string): Promise<{ users: User[]; total: number }>;
}
