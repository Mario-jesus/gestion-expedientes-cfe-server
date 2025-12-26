import { IEventBus, ILogger } from '@shared/domain';
import { User, UserNotFoundError, DuplicateUserError } from '../../domain';
import { UserUpdated } from '../../domain/events/UserUpdated';
import { IUserRepository } from '../../domain/ports/output/IUserRepository';
import { IUpdateUserUseCase } from '../ports/input/IUpdateUserUseCase';
import { UpdateUserDTO } from '../dto/UpdateUserDTO';
import { UserAuthorizationService } from '../services/UserAuthorizationService';

/**
 * Caso de uso para actualizar un usuario existente
 * 
 * Se encarga de:
 * - Validar permisos (usuario puede actualizar su perfil, admin puede actualizar cualquier usuario)
 * - Validar que el usuario exista
 * - Validar que el email no esté en uso por otro usuario (si se actualiza)
 * - Actualizar las propiedades del usuario usando métodos de la entidad
 * - Persistir los cambios
 * - Publicar eventos de dominio
 */
export class UpdateUserUseCase implements IUpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly userAuthorizationService: UserAuthorizationService,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @throws ForbiddenError si el usuario no tiene permisos para actualizar este usuario
   * @throws UserNotFoundError si el usuario no existe
   */
  async execute(userId: string, dto: UpdateUserDTO, performedBy?: string): Promise<User> {
    this.logger.info('Ejecutando caso de uso: Actualizar usuario', {
      targetUserId: userId,
      performedBy,
      fieldsToUpdate: {
        email: dto.email !== undefined,
        name: dto.name !== undefined,
        role: dto.role !== undefined,
        isActive: dto.isActive !== undefined,
      },
    });

    // Validar permisos
    if (performedBy) {
      await this.userAuthorizationService.requireCanUpdateUser(performedBy, userId);
    }

    // Obtener el usuario existente
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn('Intento de actualizar usuario inexistente', {
        targetUserId: userId,
        performedBy,
      });
      throw new UserNotFoundError(userId);
    }

    // Rastrear qué campos se actualizarán y sus valores anteriores
    const updatedFields: Array<'email' | 'name' | 'role' | 'isActive'> = [];
    const previousValues: Partial<{
      email: string;
      name: string;
      role: string;
      isActive: boolean;
    }> = {};

    // Validar y actualizar email si se proporciona
    if (dto.email && dto.email !== user.emailValue) {
      const emailExists = await this.userRepository.existsByEmail(dto.email);
      if (emailExists) {
        this.logger.warn('Intento de actualizar usuario con email duplicado', {
          targetUserId: userId,
          email: dto.email,
          performedBy,
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

    // Actualizar rol si se proporciona
    if (dto.role !== undefined && dto.role !== user.role) {
      previousValues.role = user.role;
      updatedFields.push('role');
      user.updateRole(dto.role);
    }

    // Actualizar estado activo/inactivo si se proporciona
    if (dto.isActive !== undefined && dto.isActive !== user.isActive) {
      previousValues.isActive = user.isActive;
      updatedFields.push('isActive');
      if (dto.isActive) {
        user.activate();
      } else {
        user.deactivate();
      }
    }

    // Si no hay cambios, retornar el usuario sin persistir
    if (updatedFields.length === 0) {
      this.logger.debug('Intento de actualizar usuario sin cambios', {
        targetUserId: userId,
        performedBy,
      });
      return user;
    }

    // Persistir los cambios
    const updatedUser = await this.userRepository.update(user);

    // Publicar evento de dominio con información de los campos actualizados
    await this.eventBus.publish(
      new UserUpdated(updatedUser, updatedFields, previousValues, performedBy)
    );

    this.logger.info('Usuario actualizado exitosamente', {
      targetUserId: userId,
      updatedFields,
      performedBy,
    });

    return updatedUser;
  }
}
