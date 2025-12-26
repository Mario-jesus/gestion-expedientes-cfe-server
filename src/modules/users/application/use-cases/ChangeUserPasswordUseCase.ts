import { IEventBus, ILogger } from '@shared/domain';
import { User, UserNotFoundError, InvalidCredentialsError } from '../../domain';
import { UserPasswordChanged } from '../../domain/events/UserPasswordChanged';
import { IUserRepository } from '../../domain/ports/output/IUserRepository';
import { IPasswordHasher } from '../ports/output/IPasswordHasher';
import { IChangeUserPasswordUseCase } from '../ports/input/IChangeUserPasswordUseCase';
import { ChangePasswordDTO } from '../dto/ChangePasswordDTO';
import { UserAuthorizationService } from '../services/UserAuthorizationService';

/**
 * Caso de uso para cambiar la contraseña de un usuario
 * 
 * Se encarga de:
 * - Validar permisos (usuario puede cambiar su propia contraseña, admin puede cambiar cualquier contraseña)
 * - Validar que el usuario exista
 * - Validar que la contraseña actual sea correcta (si es cambio propio)
 * - Hashear la nueva contraseña
 * - Actualizar la contraseña usando métodos de la entidad
 * - Persistir los cambios
 * - Publicar eventos de dominio
 */
export class ChangeUserPasswordUseCase implements IChangeUserPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly eventBus: IEventBus,
    private readonly userAuthorizationService: UserAuthorizationService,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @throws ForbiddenError si el usuario no tiene permisos para cambiar esta contraseña
   * @throws InvalidCredentialsError si la contraseña actual es incorrecta (solo para cambios propios)
   * @throws UserNotFoundError si el usuario no existe
   */
  async execute(userId: string, dto: ChangePasswordDTO, performedBy?: string): Promise<User> {
    this.logger.info('Ejecutando caso de uso: Cambiar contraseña de usuario', {
      targetUserId: userId,
      performedBy,
      isSelfChange: performedBy === userId,
    });

    // Validar permisos
    if (performedBy) {
      await this.userAuthorizationService.requireCanChangePassword(performedBy, userId);
    }

    // Obtener el usuario existente
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn('Intento de cambiar contraseña de usuario inexistente', {
        targetUserId: userId,
        performedBy,
      });
      throw new UserNotFoundError(userId);
    }

    // Validar contraseña actual solo si es cambio propio (no si es admin cambiando la de otro)
    if (performedBy === userId || !performedBy) {
      const isCurrentPasswordValid = await this.passwordHasher.compare(
        dto.currentPassword,
        user.passwordValue
      );

      if (!isCurrentPasswordValid) {
        this.logger.warn('Intento de cambiar contraseña con contraseña actual incorrecta', {
          targetUserId: userId,
          performedBy,
        });
        throw new InvalidCredentialsError();
      }
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await this.passwordHasher.hash(dto.newPassword);

    // Actualizar la contraseña
    user.updatePassword(hashedNewPassword);

    // Persistir los cambios
    const updatedUser = await this.userRepository.update(user);

    // Publicar evento de dominio
    // Si no se proporciona performedBy, usar el userId (el usuario cambió su propia contraseña)
    await this.eventBus.publish(new UserPasswordChanged(updatedUser.id, performedBy ?? userId));

    this.logger.info('Contraseña de usuario cambiada exitosamente', {
      targetUserId: userId,
      performedBy,
    });

    return updatedUser;
  }
}
