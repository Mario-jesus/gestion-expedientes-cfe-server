import { User } from '../../../domain/entities/User';

/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener usuario por ID
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface IGetUserByIdUseCase {
  /**
   * Obtiene un usuario por su ID
   * @param id - ID del usuario a buscar
   * @param performedBy - ID del usuario que realiza la acción (opcional, para autorización)
   * @returns El usuario encontrado
   * @throws UserNotFoundError si el usuario no existe
   * @throws ForbiddenError si el usuario no tiene permisos para ver este usuario
   */
  execute(id: string, performedBy?: string): Promise<User>;
}
