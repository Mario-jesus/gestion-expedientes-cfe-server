import { User } from '../../../domain/entities/User';
import { UpdateProfileDTO } from '../../dto/UpdateProfileDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de actualizar perfil propio
 */
export interface IUpdateMyProfileUseCase {
  /**
   * Actualiza el perfil propio del usuario autenticado
   * Solo permite actualizar nombre y email
   * @param userId - ID del usuario que actualiza su perfil
   * @param dto - DTO con los datos a actualizar (solo name y email)
   * @returns El usuario actualizado
   * @throws UserNotFoundError si el usuario no existe
   * @throws DuplicateUserError si el email ya está en uso por otro usuario
   */
  execute(userId: string, dto: UpdateProfileDTO): Promise<User>;
}
