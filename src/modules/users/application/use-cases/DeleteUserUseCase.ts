import { IEventBus, ILogger } from '@shared/domain';
import { UserNotFoundError } from '../../domain/exceptions/UserNotFoundError';
import { UserDeleted } from '../../domain/events/UserDeleted';
import { IUserRepository } from '../../domain/ports/output/IUserRepository';
import { IDeleteUserUseCase } from '../ports/input/IDeleteUserUseCase';
import { UserAuthorizationService } from '../services/UserAuthorizationService';

/**
 * Caso de uso para eliminar un usuario
 * 
 * Se encarga de:
 * - Validar permisos (solo administradores pueden eliminar usuarios, y no pueden eliminarse a sí mismos)
 * - Validar que el usuario exista
 * - Eliminar el usuario (baja física)
 * - Publicar eventos de dominio (UserDeleted)
 */
export class DeleteUserUseCase implements IDeleteUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly userAuthorizationService: UserAuthorizationService,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param userId - ID del usuario a eliminar
   * @param performedBy - ID del usuario que realiza la acción (para autorización y auditoría)
   * @returns true si se eliminó, false si no existía
   * @throws ForbiddenError si el usuario no tiene permisos o intenta eliminarse a sí mismo
   * @throws UserNotFoundError si el usuario no existe
   */
  async execute(userId: string, performedBy?: string): Promise<boolean> {
    this.logger.info('Ejecutando caso de uso: Eliminar usuario', {
      targetUserId: userId,
      performedBy,
    });

    // Validar permisos
    if (performedBy) {
      await this.userAuthorizationService.requireCanDeleteUser(performedBy, userId);
    }

    // Verificar que el usuario existe antes de eliminarlo
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn('Intento de eliminar usuario inexistente', {
        targetUserId: userId,
        performedBy,
      });
      throw new UserNotFoundError(userId);
    }

    // Eliminar el usuario
    const deleted = await this.userRepository.delete(userId);

    if (deleted) {
      // Publicar evento de dominio solo si se eliminó correctamente
      await this.eventBus.publish(new UserDeleted(userId, performedBy));
      this.logger.info('Usuario eliminado exitosamente', {
        targetUserId: userId,
        performedBy,
      });
    }

    return deleted;
  }
}
