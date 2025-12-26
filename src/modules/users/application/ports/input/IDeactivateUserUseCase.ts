import { User } from '../../../domain/entities/User';

/**
 * Puerto de entrada (Input Port) para el caso de uso de desactivar usuario
 */
export interface IDeactivateUserUseCase {
  /**
   * Desactiva un usuario
   * @param userId - ID del usuario a desactivar
   * @param performedBy - ID del usuario que realiza la acción (opcional, para auditoría)
   * @returns El usuario desactivado
   * @throws UserNotFoundError si el usuario no existe
   */
  execute(userId: string, performedBy?: string): Promise<User>;
}
