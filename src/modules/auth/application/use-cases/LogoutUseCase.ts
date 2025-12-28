import { IEventBus, ILogger } from '@shared/domain';
import { ITokenService } from '../../domain/ports/output/ITokenService';
import { IRefreshTokenRepository } from '../../domain/ports/output/IRefreshTokenRepository';
import { UserLoggedOut } from '../../domain/events/UserLoggedOut';
import { ILogoutUseCase } from '../ports/input/ILogoutUseCase';
import { IUserRepository } from '@modules/users/domain/ports/output/IUserRepository';

/**
 * Caso de uso para cerrar sesión
 * 
 * Se encarga de:
 * - Revocar refresh token específico o todos los tokens del usuario
 * - Publicar evento de dominio (UserLoggedOut)
 */
export class LogoutUseCase implements ILogoutUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param userId - ID del usuario que cierra sesión
   * @param refreshToken - Refresh token a revocar (opcional)
   * @param revokeAllTokens - Si se deben revocar todos los tokens del usuario (default: false)
   * @returns void
   */
  async execute(
    userId: string,
    refreshToken?: string,
    revokeAllTokens: boolean = false
  ): Promise<void> {
    this.logger.trace('Iniciando proceso de logout', {
      userId,
      hasRefreshToken: !!refreshToken,
      revokeAllTokens,
    });

    this.logger.debug('Ejecutando caso de uso: Logout', {
      userId,
      revokeAllTokens,
    });

    // Obtener usuario para obtener username (para el evento)
    const user = await this.userRepository.findById(userId);
    const username = user?.usernameValue || 'unknown';

    if (revokeAllTokens) {
      this.logger.trace('Revocando todos los tokens del usuario', {
        userId,
      });

      const revokedCount = await this.refreshTokenRepository.revokeAllByUserId(userId);

      this.logger.info('Todos los tokens del usuario revocados', {
        userId,
        username,
        revokedCount,
      });

      // Publicar evento de dominio
      await this.eventBus.publish(
        new UserLoggedOut(userId, username, true)
      );

      return;
    }

    // Si se proporciona un refresh token específico, revocarlo
    if (refreshToken) {
      this.logger.trace('Revocando refresh token específico', {
        userId,
        hasToken: true,
      });

      try {
        // Verificar que el token sea válido
        const payload = this.tokenService.verifyRefreshToken(refreshToken);

        if (payload.userId !== userId) {
          this.logger.warn('Intento de revocar token de otro usuario', {
            userId,
            tokenUserId: payload.userId,
          });
          // No lanzar error, solo loguear la advertencia
          return;
        }

        // Buscar el token en la base de datos
        const tokenEntity = await this.refreshTokenRepository.findByToken(refreshToken);

        if (tokenEntity) {
          tokenEntity.revoke();
          await this.refreshTokenRepository.update(tokenEntity);

          this.logger.info('Refresh token revocado exitosamente', {
            userId,
            username,
            refreshTokenId: tokenEntity.id,
          });

          // Publicar evento de dominio
          await this.eventBus.publish(
            new UserLoggedOut(userId, username, false, tokenEntity.id)
          );
        } else {
          this.logger.warn('Refresh token no encontrado en base de datos', {
            userId,
            username,
          });
        }
      } catch (error) {
        this.logger.error('Error al verificar refresh token durante logout', error as Error, {
          userId,
          username,
        });
        // No lanzar error, solo loguear
      }
    } else {
      this.logger.debug('Logout sin refresh token específico', {
        userId,
        username,
      });

      // Publicar evento de dominio (logout sin revocar token específico)
      await this.eventBus.publish(
        new UserLoggedOut(userId, username, false)
      );
    }
  }
}
