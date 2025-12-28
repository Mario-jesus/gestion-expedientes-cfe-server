import { ILogger } from '@shared/domain';
import { UserNotFoundError, UserInactiveError } from '@modules/users/domain';
import { IUserRepository } from '@modules/users/domain/ports/output/IUserRepository';
import { IGetCurrentUserUseCase } from '../ports/input/IGetCurrentUserUseCase';

/**
 * Caso de uso para obtener el usuario actual
 * 
 * Se encarga de:
 * - Obtener el usuario por ID (extraído del token)
 * - Verificar que el usuario exista
 * - Verificar que el usuario esté activo
 * - Retornar datos públicos del usuario
 */
export class GetCurrentUserUseCase implements IGetCurrentUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param userId - ID del usuario extraído del token
   * @returns Datos públicos del usuario
   * @throws UserNotFoundError si el usuario no existe
   * @throws UserInactiveError si el usuario está inactivo
   */
  async execute(userId: string): Promise<{
    id: string;
    username: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    this.logger.trace('Iniciando obtención de usuario actual', {
      userId,
    });

    this.logger.debug('Ejecutando caso de uso: Obtener usuario actual', {
      userId,
    });

    // Obtener usuario de la base de datos
    this.logger.trace('Buscando usuario en base de datos', {
      userId,
    });

    const user = await this.userRepository.findById(userId);

    if (!user) {
      this.logger.warn('Usuario no encontrado al obtener usuario actual', {
        userId,
      });
      throw new UserNotFoundError(userId);
    }

    this.logger.trace('Usuario encontrado, verificando estado', {
      userId,
      isActive: user.isActive,
    });

    // Verificar que el usuario esté activo
    if (!user.canLogin()) {
      this.logger.warn('Intento de obtener usuario actual con usuario inactivo', {
        userId,
        username: user.usernameValue,
      });
      throw new UserInactiveError(user.id);
    }

    this.logger.debug('Usuario actual obtenido exitosamente', {
      userId,
      username: user.usernameValue,
      role: user.role,
    });

    // Retornar datos públicos del usuario
    return {
      id: user.id,
      username: user.usernameValue,
      name: user.nameValue,
      email: user.emailValue,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
