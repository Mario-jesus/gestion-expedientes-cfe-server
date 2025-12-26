import { User } from '../../../domain/entities/User';

/**
 * Puerto de entrada (Input Port) para el caso de uso de activar usuario
 */
export interface IActivateUserUseCase {
  /**
   * Activa un usuario
   * @param userId - ID del usuario a activar
   * @param performedBy - ID del usuario que realiza la acción (opcional, para auditoría)
   * @returns El usuario activado
   * @throws UserNotFoundError si el usuario no existe
   */
  execute(userId: string, performedBy?: string): Promise<User>;
}
