import { IEventBus, ILogger } from '@shared/domain';
import { config } from '@shared/config';
import { IUserRepository } from '@modules/users/domain/ports/output/IUserRepository';
import { InvalidTokenError, ExpiredRefreshTokenAttemptError } from '../../domain/exceptions';
import { ITokenService } from '../../domain/ports/output/ITokenService';
import { IRefreshTokenRepository } from '../../domain/ports/output/IRefreshTokenRepository';
import { ExpiredRefreshTokenAttemptDetected } from '../../domain/events/ExpiredRefreshTokenAttemptDetected';
import { RefreshTokenReuseDetected } from '../../domain/events/RefreshTokenReuseDetected';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { IRefreshTokenUseCase } from '../ports/input/IRefreshTokenUseCase';
import { RefreshTokenDTO } from '../dto/RefreshTokenDTO';

/**
 * Caso de uso para refrescar un access token
 * 
 * Implementa rotación de tokens: cada refresh token solo puede usarse una vez.
 * Cuando se usa un refresh token, se invalida y se genera uno nuevo.
 * 
 * Se encarga de:
 * - Verificar que el refresh token sea válido
 * - Detectar reutilización de tokens (intento de usar token ya revocado) - posible brecha de seguridad
 * - Verificar que el refresh token no esté expirado
 * - Detectar intentos de usar tokens expirados (posible brecha de seguridad)
 * - Revocar todos los tokens del usuario si se detecta actividad sospechosa
 * - Revocar el refresh token usado (rotación)
 * - Generar nuevo refresh token
 * - Generar nuevo access token
 * - Retornar nuevo access token, nuevo refresh token y tiempo de expiración
 */
export class RefreshTokenUseCase implements IRefreshTokenUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con el refresh token
   * @param ipAddress - IP del cliente (opcional, para auditoría)
   * @param userAgent - User-Agent del cliente (opcional, para auditoría)
   * @returns Nuevo access token, nuevo refresh token y tiempo de expiración
   * @throws InvalidTokenError si el refresh token es inválido o ya fue usado (reutilización detectada)
   * @throws ExpiredRefreshTokenAttemptError si se detecta intento de usar token expirado (todos los tokens del usuario serán revocados)
   */
  async execute(
    dto: RefreshTokenDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    token: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    this.logger.trace('Iniciando proceso de refresh token', {
      hasToken: !!dto.refreshToken,
    });

    this.logger.debug('Ejecutando caso de uso: Refresh token', {
      hasToken: true,
    });

    // Verificar y decodificar el refresh token
    this.logger.trace('Verificando refresh token', {
      hasToken: true,
    });

    let payload;
    let decoded: { userId?: string; exp?: number } | null = null;

    try {
      payload = this.tokenService.verifyRefreshToken(dto.refreshToken);
    } catch (error) {
      this.logger.warn('Refresh token inválido o expirado al verificar', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Decodificar el token para obtener información incluso si está expirado
      decoded = this.tokenService.decodeToken(dto.refreshToken);

      // Verificar si es error de expiración
      if (decoded && decoded.exp) {
        const expirationDate = new Date(decoded.exp * 1000);
        const now = new Date();

        if (expirationDate < now) {
          // Token expirado - esto es una posible brecha de seguridad
          const userId = decoded.userId;

          if (userId) {
            this.logger.warn('Refresh token expirado detectado al verificar - posible brecha de seguridad', {
              userId,
              expirationDate: expirationDate.toISOString(),
              currentTime: now.toISOString(),
              timeSinceExpiration: now.getTime() - expirationDate.getTime(),
            });

            // Obtener información del usuario
            const user = await this.userRepository.findById(userId);
            const username = user?.usernameValue || 'unknown';

            // Crear preview del token
            const tokenPreview = this.createTokenPreview(dto.refreshToken);

            // Revocar TODOS los tokens del usuario por seguridad
            this.logger.error('Revocando todos los tokens del usuario por token expirado al verificar', undefined, {
              userId,
              username,
              reason: 'Expired refresh token verification failure - potential security breach',
              action: 'Revoking all user tokens',
            });

            const revokedCount = await this.refreshTokenRepository.revokeAllByUserId(userId);

            this.logger.fatal('Intento de usar refresh token expirado detectado (verificación) - todos los tokens revocados', undefined, {
              userId,
              username,
              expirationDate: expirationDate.toISOString(),
              revokedTokensCount: revokedCount,
              severity: 'HIGH',
              securityIncident: true,
            });

            // Publicar evento de seguridad
            await this.eventBus.publish(
              new ExpiredRefreshTokenAttemptDetected(
                userId,
                expirationDate,
                tokenPreview,
                true, // allTokensRevoked
                undefined // No tenemos el refreshTokenId porque falló la verificación
              )
            );

            // Lanzar excepción específica
            throw new ExpiredRefreshTokenAttemptError(userId);
          }
        }
      }

      // Si no es un token expirado, es simplemente inválido
      throw new InvalidTokenError('Refresh token inválido');
    }

    if (!payload || !payload.userId) {
      this.logger.error('Payload del refresh token inválido', undefined, {
        hasPayload: !!payload,
      });
      throw new InvalidTokenError('Refresh token con payload inválido');
    }

    this.logger.trace('Refresh token verificado, buscando en base de datos', {
      userId: payload.userId,
    });

    // Buscar el refresh token en la base de datos
    const refreshTokenEntity = await this.refreshTokenRepository.findByToken(dto.refreshToken);

    if (!refreshTokenEntity) {
      this.logger.warn('Refresh token no encontrado en base de datos', {
        userId: payload.userId,
      });
      throw new InvalidTokenError('Refresh token no encontrado');
    }

    this.logger.trace('Refresh token encontrado, verificando validez', {
      userId: payload.userId,
      refreshTokenId: refreshTokenEntity.id,
      isRevoked: refreshTokenEntity.isRevoked,
      isExpired: refreshTokenEntity.isExpired(),
    });

    // Verificar que el token no esté revocado
    // Si está revocado, es una reutilización de token (posible brecha de seguridad)
    if (refreshTokenEntity.isRevoked) {
      this.logger.warn('Intento de reutilizar refresh token revocado - posible brecha de seguridad', {
        userId: payload.userId,
        refreshTokenId: refreshTokenEntity.id,
        revokedAt: refreshTokenEntity.updatedAt.toISOString(),
      });

      // Obtener información del usuario para el evento
      const user = await this.userRepository.findById(payload.userId);
      const username = user?.usernameValue || 'unknown';

      // Crear preview del token
      const tokenPreview = this.createTokenPreview(dto.refreshToken);

      // Revocar TODOS los tokens del usuario por seguridad
      // Esto previene que alguien con un token robado pueda seguir intentando usarlo
      this.logger.error('Revocando todos los tokens del usuario por reutilización de token', undefined, {
        userId: payload.userId,
        username,
        refreshTokenId: refreshTokenEntity.id,
        reason: 'Refresh token reuse detected - potential security breach',
        action: 'Revoking all user tokens',
      });

      const revokedCount = await this.refreshTokenRepository.revokeAllByUserId(payload.userId);

      this.logger.fatal('Reutilización de refresh token detectada - todos los tokens revocados', undefined, {
        userId: payload.userId,
        username,
        refreshTokenId: refreshTokenEntity.id,
        tokenRevokedAt: refreshTokenEntity.updatedAt.toISOString(),
        revokedTokensCount: revokedCount,
        severity: 'HIGH',
        securityIncident: true,
      });

      // Publicar evento de seguridad
      await this.eventBus.publish(
        new RefreshTokenReuseDetected(
          payload.userId,
          refreshTokenEntity.id,
          tokenPreview,
          refreshTokenEntity.updatedAt,
          true, // allTokensRevoked
          ipAddress,
          userAgent
        )
      );

      // Lanzar excepción
      throw new InvalidTokenError('Refresh token ya fue usado. Por seguridad, todos tus tokens han sido revocados. Por favor inicia sesión nuevamente.');
    }

    // Verificar que el token no esté expirado
    if (refreshTokenEntity.isExpired()) {
      this.logger.warn('Intento de usar refresh token expirado - posible brecha de seguridad', {
        userId: payload.userId,
        refreshTokenId: refreshTokenEntity.id,
        expiresAt: refreshTokenEntity.expiresAt.toISOString(),
        currentTime: new Date().toISOString(),
      });

      // Obtener información del usuario para el evento
      const user = await this.userRepository.findById(payload.userId);
      const username = user?.usernameValue || 'unknown';

      // Crear preview del token (primeros y últimos caracteres para auditoría)
      const tokenPreview = this.createTokenPreview(dto.refreshToken);

      // Revocar TODOS los tokens del usuario por seguridad
      // Esto previene que alguien con un token robado pueda seguir usándolo
      this.logger.error('Revocando todos los tokens del usuario por intento de usar token expirado', undefined, {
        userId: payload.userId,
        username,
        reason: 'Expired refresh token attempt - potential security breach',
        action: 'Revoking all user tokens',
      });

      const revokedCount = await this.refreshTokenRepository.revokeAllByUserId(payload.userId);

      this.logger.fatal('Intento de usar refresh token expirado detectado - todos los tokens revocados', undefined, {
        userId: payload.userId,
        username,
        refreshTokenId: refreshTokenEntity.id,
        expiresAt: refreshTokenEntity.expiresAt.toISOString(),
        revokedTokensCount: revokedCount,
        severity: 'HIGH',
        securityIncident: true,
      });

      // Publicar evento de seguridad
      await this.eventBus.publish(
        new ExpiredRefreshTokenAttemptDetected(
          payload.userId,
          refreshTokenEntity.expiresAt,
          tokenPreview,
          true, // allTokensRevoked
          refreshTokenEntity.id
        )
      );

      // Lanzar excepción específica
      throw new ExpiredRefreshTokenAttemptError(payload.userId, refreshTokenEntity.id);
    }

    // Verificar que el userId del token coincida con el de la entidad
    if (refreshTokenEntity.userId !== payload.userId) {
      this.logger.error('UserId del token no coincide con el de la entidad', undefined, {
        tokenUserId: payload.userId,
        entityUserId: refreshTokenEntity.userId,
        refreshTokenId: refreshTokenEntity.id,
      });
      throw new InvalidTokenError('Refresh token con userId inconsistente');
    }

    this.logger.trace('Refresh token válido, generando nuevo access token', {
      userId: payload.userId,
    });

    // Obtener información del usuario completo para generar el access token
    // Esto asegura que usamos datos actualizados (username y role pueden haber cambiado)
    this.logger.trace('Obteniendo información del usuario para generar access token', {
      userId: payload.userId,
    });

    const user = await this.userRepository.findById(payload.userId);

    if (!user) {
      this.logger.error('Usuario no encontrado al generar access token', undefined, {
        userId: payload.userId,
      });
      throw new InvalidTokenError('Usuario asociado al token no encontrado');
    }

    // Verificar que el usuario esté activo
    if (!user.canLogin()) {
      this.logger.warn('Intento de refrescar token con usuario inactivo', {
        userId: payload.userId,
        username: user.usernameValue,
      });
      throw new InvalidTokenError('Usuario inactivo');
    }

    // ============================================
    // ROTACIÓN DE TOKENS: Invalidar el token usado y generar uno nuevo
    // ============================================

    this.logger.trace('Revocando refresh token usado (rotación)', {
      userId: payload.userId,
      refreshTokenId: refreshTokenEntity.id,
    });

    // Revocar el refresh token usado
    refreshTokenEntity.revoke();
    await this.refreshTokenRepository.update(refreshTokenEntity);

    this.logger.trace('Refresh token revocado, generando nuevo refresh token', {
      userId: payload.userId,
      oldRefreshTokenId: refreshTokenEntity.id,
    });

    // Generar nuevo refresh token
    const newRefreshTokenString = this.tokenService.generateRefreshToken({
      userId: user.id,
    });

    // Calcular fecha de expiración del nuevo refresh token
    const newRefreshTokenExpiresAt = new Date();
    newRefreshTokenExpiresAt.setSeconds(
      newRefreshTokenExpiresAt.getSeconds() + this.parseExpiresIn(config.security.jwt.refreshExpiresIn)
    );

    // Crear y persistir el nuevo refresh token
    const newRefreshToken = RefreshToken.create({
      token: newRefreshTokenString,
      userId: user.id,
      expiresAt: newRefreshTokenExpiresAt,
      isRevoked: false,
    });

    await this.refreshTokenRepository.create(newRefreshToken);

    this.logger.trace('Nuevo refresh token creado, generando access token', {
      userId: payload.userId,
      oldRefreshTokenId: refreshTokenEntity.id,
      newRefreshTokenId: newRefreshToken.id,
    });

    // Generar nuevo access token con información actualizada del usuario
    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      username: user.usernameValue,
      role: user.role,
    });

    // Calcular tiempo de expiración en segundos
    const expiresIn = this.parseExpiresIn(config.security.jwt.expiresIn);

    this.logger.info('Tokens refrescados exitosamente con rotación', {
      userId: payload.userId,
      oldRefreshTokenId: refreshTokenEntity.id,
      newRefreshTokenId: newRefreshToken.id,
    });

    return {
      token: accessToken,
      refreshToken: newRefreshTokenString,
      expiresIn,
    };
  }

  /**
   * Crea un preview del token para auditoría (primeros y últimos caracteres)
   * @param token - Token completo
   * @returns Preview del token (ej: "eyJhbGc...xyz123")
   */
  private createTokenPreview(token: string): string {
    if (token.length <= 20) {
      return token.substring(0, 10) + '...';
    }
    return token.substring(0, 10) + '...' + token.substring(token.length - 10);
  }

  /**
   * Parsea un string de tiempo de expiración (ej: "1h", "7d") a segundos
   * @param expiresIn - String con el tiempo de expiración
   * @returns Tiempo en segundos
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Si no tiene formato, asumir que son segundos
      const seconds = parseInt(expiresIn, 10);
      if (isNaN(seconds)) {
        this.logger.error('Formato de expiresIn inválido, usando default de 1 hora', undefined, {
          expiresIn,
        });
        return 3600; // Default: 1 hora
      }
      return seconds;
    }

    const value = parseInt(match[1]!, 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        this.logger.warn('Unidad de tiempo desconocida, usando default de 1 hora', {
          unit,
          expiresIn,
        });
        return 3600;
    }
  }
}
