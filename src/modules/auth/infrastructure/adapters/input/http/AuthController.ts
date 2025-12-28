import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@shared/domain';
import { ILoginUseCase } from '@modules/auth/application/ports/input/ILoginUseCase';
import { ILogoutUseCase } from '@modules/auth/application/ports/input/ILogoutUseCase';
import { IGetCurrentUserUseCase } from '@modules/auth/application/ports/input/IGetCurrentUserUseCase';
import { IRefreshTokenUseCase } from '@modules/auth/application/ports/input/IRefreshTokenUseCase';
import { LoginDTO } from '@modules/auth/application/dto/LoginDTO';
import { RefreshTokenDTO } from '@modules/auth/application/dto/RefreshTokenDTO';
import { AuthenticatedRequest } from '@shared/infrastructure';

/**
 * Controller HTTP para la autenticación
 * 
 * Este controller actúa como adaptador de entrada (Input Adapter) que convierte
 * requests HTTP en llamadas a casos de uso de la capa de aplicación.
 * 
 * Responsabilidades:
 * - Recibir requests HTTP de autenticación
 * - Validar y mapear datos del request a DTOs
 * - Llamar a los casos de uso correspondientes
 * - Formatear respuestas HTTP
 * - Manejar errores (delegados al errorHandler de Express)
 */
export class AuthController {
  constructor(
    private readonly loginUseCase: ILoginUseCase,
    private readonly logoutUseCase: ILogoutUseCase,
    private readonly getCurrentUserUseCase: IGetCurrentUserUseCase,
    private readonly refreshTokenUseCase: IRefreshTokenUseCase,
    private readonly logger: ILogger
  ) {}

  /**
   * POST /auth/login
   * Inicia sesión de un usuario
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: LoginDTO = req.body;

      this.logger.trace('Request de login recibido', {
        username: dto.username,
        hasPassword: !!dto.password,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Validar que username y password estén presentes
      if (!dto.username || !dto.password) {
        this.logger.warn('Intento de login con datos incompletos', {
          hasUsername: !!dto.username,
          hasPassword: !!dto.password,
          ip: req.ip,
        });
        res.status(400).json({
          error: 'Username y password son requeridos',
          code: 'MISSING_CREDENTIALS',
        });
        return;
      }

      this.logger.debug('Ejecutando caso de uso: Login', {
        username: dto.username,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      const response = await this.loginUseCase.execute(
        dto,
        req.ip,
        req.get('user-agent')
      );

      this.logger.info('Login exitoso', {
        userId: response.user.id,
        username: response.user.username,
        role: response.user.role,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/logout
   * Cierra sesión del usuario actual
   * Requiere autenticación (middleware authenticate)
   */
  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;
      const refreshToken = req.body.refreshToken as string | undefined;

      this.logger.trace('Request de logout recibido', {
        userId,
        hasRefreshToken: !!refreshToken,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      this.logger.debug('Ejecutando caso de uso: Logout', {
        userId,
        hasRefreshToken: !!refreshToken,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      await this.logoutUseCase.execute(userId, refreshToken);

      this.logger.info('Logout exitoso', {
        userId,
        hasRefreshToken: !!refreshToken,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(200).json({
        message: 'Logout exitoso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/me
   * Obtiene información del usuario autenticado
   * Requiere autenticación (middleware authenticate)
   */
  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;

      this.logger.trace('Request de información de usuario recibido', {
        userId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      this.logger.debug('Ejecutando caso de uso: GetCurrentUser', {
        userId,
      });

      const user = await this.getCurrentUserUseCase.execute(userId);

      this.logger.debug('Información de usuario obtenida', {
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      res.status(200).json({
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/refresh
   * Refresca el access token usando un refresh token
   * 
   * Implementa rotación de tokens: el refresh token usado se invalida
   * y se genera uno nuevo. Retorna tanto el nuevo access token como el nuevo refresh token.
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: RefreshTokenDTO = req.body;

      this.logger.trace('Request de refresh token recibido', {
        hasRefreshToken: !!dto.refreshToken,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Validar que refreshToken esté presente
      if (!dto.refreshToken) {
        this.logger.warn('Intento de refresh sin refreshToken', {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        res.status(400).json({
          error: 'refreshToken es requerido',
          code: 'MISSING_REFRESH_TOKEN',
        });
        return;
      }

      this.logger.debug('Ejecutando caso de uso: RefreshToken', {
        hasRefreshToken: true,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      const response = await this.refreshTokenUseCase.execute(
        dto,
        req.ip,
        req.get('user-agent')
      );

      this.logger.info('Refresh token exitoso con rotación', {
        expiresIn: response.expiresIn,
        hasNewRefreshToken: !!response.refreshToken,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
