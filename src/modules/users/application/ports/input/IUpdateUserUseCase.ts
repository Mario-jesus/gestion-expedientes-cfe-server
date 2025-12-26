import { User } from '../../../domain/entities/User';
import { UpdateUserDTO } from '../../dto/UpdateUserDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de actualizar usuario
 */
export interface IUpdateUserUseCase {
  /**
   * Actualiza un usuario existente
   * @param userId - ID del usuario a actualizar
   * @param dto - DTO con los datos a actualizar (parcial)
   * @param performedBy - ID del usuario que realiza la acción (opcional, para auditoría)
   * @returns El usuario actualizado
   * @throws UserNotFoundError si el usuario no existe
   * @throws DuplicateUserError si el email ya está en uso por otro usuario
   * @throws ForbiddenError si el usuario no tiene permisos para actualizar este usuario
   */
  execute(userId: string, dto: UpdateUserDTO, performedBy?: string): Promise<User>;
}
