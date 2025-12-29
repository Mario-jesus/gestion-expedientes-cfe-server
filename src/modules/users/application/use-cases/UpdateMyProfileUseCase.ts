import { IEventBus, ILogger } from '@shared/domain';
import { User, UserNotFoundError, DuplicateUserError } from '../../domain';
import { UserUpdated } from '../../domain/events/UserUpdated';
import { IUserRepository } from '../../domain/ports/output/IUserRepository';
import { IUpdateMyProfileUseCase } from '../ports/input/IUpdateMyProfileUseCase';
import { UpdateProfileDTO } from '../dto/UpdateProfileDTO';

/**
 * Caso de uso para actualizar el perfil propio de un usuario
 * 
 * Se encarga de:
 * - Validar que el usuario exista
 * - Validar que el email no esté en uso por otro usuario (si se actualiza)
 * - Actualizar solo nombre y email (no permite actualizar username, role, isActive)
 * - Persistir los cambios
 * - Publicar eventos de dominio
 * 
 * Este caso de uso es específico para que los usuarios editen su propio perfil.
 * Los administradores deben usar UpdateUserUseCase para actualizar otros usuarios.
 */
export class UpdateMyProfileUseCase implements IUpdateMyProfileUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param userId - ID del usuario que actualiza su perfil
   * @param dto - DTO con los datos a actualizar (solo name y email)
   * @throws UserNotFoundError si el usuario no existe
   * @throws DuplicateUserError si el email ya está en uso por otro usuario
   */
  async execute(userId: string, dto: UpdateProfileDTO): Promise<User> {
    this.logger.info('Ejecutando caso de uso: Actualizar perfil propio', {
      userId,
      fieldsToUpdate: {
        email: dto.email !== undefined,
        name: dto.name !== undefined,
      },
    });

    // Obtener el usuario existente
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn('Intento de actualizar perfil de usuario inexistente', {
        userId,
      });
      throw new UserNotFoundError(userId);
    }

    // Rastrear qué campos se actualizarán y sus valores anteriores
    const updatedFields: Array<'email' | 'name'> = [];
    const previousValues: Partial<{
      email: string;
      name: string;
    }> = {};

    // Validar y actualizar email si se proporciona
    if (dto.email && dto.email !== user.emailValue) {
      const emailExists = await this.userRepository.existsByEmail(dto.email);
      if (emailExists) {
        this.logger.warn('Intento de actualizar perfil con email duplicado', {
          userId,
          email: dto.email,
        });
        throw new DuplicateUserError('email', dto.email);
      }
      previousValues.email = user.emailValue;
      updatedFields.push('email');
      user.updateEmail(dto.email);
    }

    // Actualizar nombre si se proporciona
    if (dto.name !== undefined && dto.name !== user.nameValue) {
      previousValues.name = user.nameValue;
      updatedFields.push('name');
      user.updateName(dto.name);
    }

    // Si no hay cambios, retornar el usuario sin persistir
    if (updatedFields.length === 0) {
      this.logger.debug('Intento de actualizar perfil sin cambios', {
        userId,
      });
      return user;
    }

    // Persistir los cambios
    const updatedUser = await this.userRepository.update(user);

    // Publicar evento de dominio con información de los campos actualizados
    await this.eventBus.publish(
      new UserUpdated(updatedUser, updatedFields, previousValues, userId)
    );

    this.logger.info('Perfil actualizado exitosamente', {
      userId,
      updatedFields,
    });

    return updatedUser;
  }
}
