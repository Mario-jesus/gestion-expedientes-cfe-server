import { User } from '../../../domain/entities/User';
import { ChangePasswordDTO } from '../../dto/ChangePasswordDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de cambiar contraseña
 */
export interface IChangeUserPasswordUseCase {
  /**
   * Cambia la contraseña de un usuario
   * @param userId - ID del usuario cuya contraseña se va a cambiar
   * @param dto - DTO con la contraseña actual y la nueva contraseña
   * @param performedBy - ID del usuario que realiza la acción (opcional, para auditoría)
   * @returns El usuario actualizado
   * @throws UserNotFoundError si el usuario no existe
   * @throws InvalidCredentialsError si la contraseña actual es incorrecta
   */
  execute(userId: string, dto: ChangePasswordDTO, performedBy?: string): Promise<User>;
}
