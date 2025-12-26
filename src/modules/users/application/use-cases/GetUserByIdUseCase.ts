import { ILogger } from '@shared/domain';
import { User } from '../../domain/entities/User';
import { UserNotFoundError } from '../../domain/exceptions/UserNotFoundError';
import { ForbiddenError } from '../../domain/exceptions/ForbiddenError';
import { IUserRepository } from '../../domain/ports/output/IUserRepository';
import { IGetUserByIdUseCase } from '../ports/input/IGetUserByIdUseCase';
import { UserAuthorizationService } from '../services/UserAuthorizationService';

/**
 * Caso de uso para obtener un usuario por su ID
 */
export class GetUserByIdUseCase implements IGetUserByIdUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userAuthorizationService: UserAuthorizationService,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID del usuario a buscar
   * @param performedBy - ID del usuario que realiza la acción (para autorización)
   * @returns El usuario encontrado
   * @throws UserNotFoundError si el usuario no existe
   * @throws ForbiddenError si el usuario no tiene permisos para ver este usuario
   */
  async execute(id: string, performedBy?: string): Promise<User> {
    this.logger.debug('Ejecutando caso de uso: Obtener usuario por ID', {
      targetUserId: id,
      performedBy,
    });

    const user = await this.userRepository.findById(id);

    if (!user) {
      this.logger.warn('Intento de obtener usuario inexistente', {
        targetUserId: id,
        performedBy,
      });
      throw new UserNotFoundError(id);
    }

    // Validar permisos: solo puede ver su propio perfil o ser admin
    if (performedBy) {
      const canView = await this.userAuthorizationService.canViewUser(performedBy, id);
      if (!canView) {
        this.logger.warn('Intento de ver usuario sin permisos', {
          targetUserId: id,
          performedBy,
        });
        throw new ForbiddenError('No tienes permisos para ver este usuario');
      }
    }

    this.logger.debug('Usuario obtenido exitosamente', {
      targetUserId: id,
      performedBy,
    });

    return user;
  }
}
