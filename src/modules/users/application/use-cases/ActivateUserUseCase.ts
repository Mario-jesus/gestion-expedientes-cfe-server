import { IEventBus, ILogger } from '@shared/domain';
import { User, UserNotFoundError } from '../../domain';
import { UserActivated } from '../../domain/events/UserActivated';
import { IUserRepository } from '../../domain/ports/output/IUserRepository';
import { IActivateUserUseCase } from '../ports/input/IActivateUserUseCase';
import { UserAuthorizationService } from '../services/UserAuthorizationService';

/**
 * Caso de uso para activar un usuario
 * 
 * Se encarga de:
 * - Validar permisos (solo administradores pueden activar usuarios, y no pueden activarse a sí mismos)
 * - Validar que el usuario exista
 * - Activar el usuario usando métodos de la entidad
 * - Persistir los cambios
 * - Publicar eventos de dominio
 */
export class ActivateUserUseCase implements IActivateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly userAuthorizationService: UserAuthorizationService,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @throws ForbiddenError si el usuario no tiene permisos o intenta activarse a sí mismo
   * @throws UserNotFoundError si el usuario no existe
   */
  async execute(userId: string, performedBy?: string): Promise<User> {
    this.logger.info('Ejecutando caso de uso: Activar usuario', {
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
      this.logger.warn('Intento de activar usuario inexistente', {
        targetUserId: userId,
        performedBy,
      });
      throw new UserNotFoundError(userId);
    }

    // Activar el usuario
    user.activate();

    // Persistir los cambios
    const updatedUser = await this.userRepository.update(user);

    // Publicar evento de dominio
    await this.eventBus.publish(new UserActivated(updatedUser.id, performedBy));

    this.logger.info('Usuario activado exitosamente', {
      targetUserId: userId,
      performedBy,
    });

    return updatedUser;
  }
}
