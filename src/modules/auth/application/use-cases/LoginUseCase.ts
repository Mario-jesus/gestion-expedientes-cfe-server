import { IEventBus, ILogger } from '@shared/domain';
import { config } from '@shared/config';
import { InvalidCredentialsError, UserInactiveError } from '@modules/users/domain';
import { IUserRepository } from '@modules/users/domain/ports/output/IUserRepository';
import { IPasswordHasher } from '@modules/users/application/ports/output/IPasswordHasher';
import { ITokenService } from '../../domain/ports/output/ITokenService';
import { IRefreshTokenRepository } from '../../domain/ports/output/IRefreshTokenRepository';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { UserLoggedIn } from '../../domain/events/UserLoggedIn';
import { ILoginUseCase } from '../ports/input/ILoginUseCase';
import { LoginDTO } from '../dto/LoginDTO';
import { AuthResponseDTO } from '../dto/AuthResponseDTO';

/**
 * Caso de uso para iniciar sesión
 * 
 * Se encarga de:
 * - Validar credenciales (username y password)
 * - Verificar que el usuario esté activo
 * - Generar access token y refresh token
 * - Persistir refresh token (opcional)
 * - Publicar evento de dominio (UserLoggedIn)
 */
export class LoginUseCase implements ILoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con username y password
   * @param ipAddress - IP del cliente (opcional, para auditoría)
   * @param userAgent - User-Agent del cliente (opcional, para auditoría)
   * @returns Respuesta de autenticación con tokens y datos del usuario
   * @throws InvalidCredentialsError si las credenciales son inválidas
   * @throws UserInactiveError si el usuario está inactivo
   */
  async execute(
    dto: LoginDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponseDTO> {
    this.logger.trace('Iniciando proceso de login', {
      username: dto.username,
      hasPassword: !!dto.password,
      ipAddress,
      userAgent,
    });

    this.logger.debug('Ejecutando caso de uso: Login', {
      username: dto.username,
      ipAddress,
      userAgent,
    });

    // Buscar usuario por username
    this.logger.trace('Buscando usuario por username', {
      username: dto.username,
    });

    const user = await this.userRepository.findByUsername(dto.username);

    if (!user) {
      this.logger.warn('Intento de login con username inexistente', {
        username: dto.username,
        ipAddress,
        userAgent,
      });
      throw new InvalidCredentialsError();
    }

    this.logger.trace('Usuario encontrado, verificando contraseña', {
      userId: user.id,
      username: user.usernameValue,
    });

    // Verificar contraseña
    const isPasswordValid = await this.passwordHasher.compare(
      dto.password,
      user.passwordValue
    );

    if (!isPasswordValid) {
      this.logger.warn('Intento de login con contraseña incorrecta', {
        userId: user.id,
        username: user.usernameValue,
        ipAddress,
        userAgent,
      });
      throw new InvalidCredentialsError();
    }

    this.logger.trace('Contraseña válida, verificando estado del usuario', {
      userId: user.id,
      isActive: user.isActive,
    });

    // Verificar que el usuario esté activo
    if (!user.canLogin()) {
      this.logger.warn('Intento de login con usuario inactivo', {
        userId: user.id,
        username: user.usernameValue,
        ipAddress,
        userAgent,
      });
      throw new UserInactiveError(user.id);
    }

    this.logger.trace('Usuario válido, generando tokens', {
      userId: user.id,
      role: user.role,
    });

    // Generar access token
    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      username: user.usernameValue,
      role: user.role,
    });

    // Generar refresh token
    const refreshTokenString = this.tokenService.generateRefreshToken({
      userId: user.id,
    });

    this.logger.trace('Tokens generados, calculando tiempo de expiración', {
      userId: user.id,
    });

    // Calcular tiempo de expiración en segundos
    // Parsear expiresIn de la configuración (ej: "1h" -> 3600)
    const expiresIn = this.parseExpiresIn(config.security.jwt.expiresIn);

    this.logger.trace('Persistiendo refresh token', {
      userId: user.id,
    });

    // Crear y persistir refresh token
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setSeconds(
      refreshTokenExpiresAt.getSeconds() + this.parseExpiresIn(config.security.jwt.refreshExpiresIn)
    );

    const refreshToken = RefreshToken.create({
      token: refreshTokenString,
      userId: user.id,
      expiresAt: refreshTokenExpiresAt,
      isRevoked: false,
    });

    await this.refreshTokenRepository.create(refreshToken);

    this.logger.trace('Refresh token persistido, publicando evento', {
      userId: user.id,
      refreshTokenId: refreshToken.id,
    });

    // Publicar evento de dominio
    await this.eventBus.publish(
      new UserLoggedIn(user.id, user.usernameValue, ipAddress, userAgent)
    );

    this.logger.info('Login exitoso', {
      userId: user.id,
      username: user.usernameValue,
      role: user.role,
      ipAddress,
      userAgent,
    });

    // Retornar respuesta
    return {
      token: accessToken,
      refreshToken: refreshTokenString,
      expiresIn,
      user: {
        id: user.id,
        username: user.usernameValue,
        name: user.nameValue,
        email: user.emailValue,
        role: user.role,
        isActive: user.isActive,
      },
    };
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
