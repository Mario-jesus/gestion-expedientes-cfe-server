import { IEventBus, ILogger } from '@shared/domain';
import { User, UserNotFoundError } from '../../domain';
import { UserDeactivated } from '../../domain/events/UserDeactivated';
import { IUserRepository } from '../../domain/ports/output/IUserRepository';
import { IDeactivateUserUseCase } from '../ports/input/IDeactivateUserUseCase';
import { UserAuthorizationService } from '../services/UserAuthorizationService';

/**
 * Caso de uso para desactivar un usuario
 * 
 * Se encarga de:
 * - Validar permisos (solo administradores pueden desactivar usuarios, y no pueden desactivarse a sí mismos)
 * - Validar que el usuario exista
 * - Desactivar el usuario usando métodos de la entidad
 * - Persistir los cambios
 * - Publicar eventos de dominio
 */
export class DeactivateUserUseCase implements IDeactivateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly userAuthorizationService: UserAuthorizationService,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @throws ForbiddenError si el usuario no tiene permisos o intenta desactivarse a sí mismo
   * @throws UserNotFoundError si el usuario no existe
   */
  async execute(userId: string, performedBy?: string): Promise<User> {
    this.logger.info('Ejecutando caso de uso: Desactivar usuario', {
      targetUserId: userId,
      performedBy,
    });

    // Validar permisos
    if (performedBy) {
      await this.userAuthorizationService.requireCanActivateDeactivateUser(performedBy, userId);
    }

    // Obtener el usuario existente
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn('Intento de desactivar usuario inexistente', {
        targetUserId: userId,
        performedBy,
      });
      throw new UserNotFoundError(userId);
    }

    // Desactivar el usuario
    user.deactivate();

    // Persistir los cambios
    const updatedUser = await this.userRepository.update(user);

    // Publicar evento de dominio
    await this.eventBus.publish(new UserDeactivated(updatedUser.id, performedBy));

    this.logger.info('Usuario desactivado exitosamente', {
      targetUserId: userId,
      performedBy,
    });

    return updatedUser;
  }
}
