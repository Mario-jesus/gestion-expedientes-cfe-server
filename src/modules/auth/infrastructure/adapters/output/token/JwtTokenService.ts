import jwt from 'jsonwebtoken';
import { ITokenService } from '@modules/auth/domain/ports/output/ITokenService';
import { InvalidTokenError, TokenExpiredError } from '@modules/auth/domain/exceptions';
import { config } from '@shared/config';
import { ILogger } from '@shared/domain';

/**
 * Implementación del servicio de tokens JWT usando jsonwebtoken
 * 
 * Este adaptador proporciona funcionalidad para generar, verificar y decodificar
 * tokens JWT usando la librería jsonwebtoken.
 * 
 * Configuración:
 * - Access tokens: Usan JWT_SECRET y JWT_EXPIRES_IN
 * - Refresh tokens: Usan JWT_REFRESH_SECRET (o JWT_SECRET si no se especifica) y JWT_REFRESH_EXPIRES_IN
 */
export class JwtTokenService implements ITokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;
  private readonly logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
    this.accessTokenSecret = config.security.jwt.secret;
    this.refreshTokenSecret = config.security.jwt.refreshSecret;
    this.accessTokenExpiresIn = config.security.jwt.expiresIn;
    this.refreshTokenExpiresIn = config.security.jwt.refreshExpiresIn;

    this.logger.debug('JwtTokenService inicializado', {
      hasAccessSecret: !!this.accessTokenSecret,
      hasRefreshSecret: !!this.refreshTokenSecret,
      accessExpiresIn: this.accessTokenExpiresIn,
      refreshExpiresIn: this.refreshTokenExpiresIn,
    });
  }

  /**
   * Genera un access token JWT
   * @param payload - Datos a incluir en el token (userId, username, role)
   * @returns Token JWT como string
   */
  generateAccessToken(payload: {
    userId: string;
    username: string;
    role: string;
  }): string {
    try {
      if (!payload.userId || !payload.username || !payload.role) {
        throw new Error('Payload incompleto: userId, username y role son requeridos');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signOptions: jwt.SignOptions = {
        expiresIn: this.accessTokenExpiresIn as any,
      };

      const token = jwt.sign(
        {
          userId: payload.userId,
          username: payload.username,
          role: payload.role,
        },
        this.accessTokenSecret,
        signOptions
      );

      this.logger.trace('Access token generado', {
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
        expiresIn: this.accessTokenExpiresIn,
      });

      return token;
    } catch (error) {
      this.logger.error('Error al generar access token', error instanceof Error ? error : new Error(String(error)), {
        userId: payload.userId,
        username: payload.username,
      });
      throw new Error(`Error al generar access token: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Genera un refresh token JWT
   * @param payload - Datos a incluir en el token (userId)
   * @returns Refresh token JWT como string
   */
  generateRefreshToken(payload: { userId: string }): string {
    try {
      if (!payload.userId) {
        throw new Error('Payload incompleto: userId es requerido');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signOptions: jwt.SignOptions = {
        expiresIn: this.refreshTokenExpiresIn as any,
        jwtid: crypto.randomUUID(), // Agregar JWT ID único para garantizar tokens diferentes
      };

      const token = jwt.sign(
        {
          userId: payload.userId,
        },
        this.refreshTokenSecret,
        signOptions
      );

      this.logger.trace('Refresh token generado', {
        userId: payload.userId,
        expiresIn: this.refreshTokenExpiresIn,
      });

      return token;
    } catch (error) {
      this.logger.error('Error al generar refresh token', error instanceof Error ? error : new Error(String(error)), {
        userId: payload.userId,
      });
      throw new Error(`Error al generar refresh token: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Verifica y decodifica un access token
   * @param token - Token JWT a verificar
   * @returns Payload decodificado si el token es válido
   * @throws InvalidTokenError si el token es inválido
   * @throws TokenExpiredError si el token ha expirado
   */
  verifyAccessToken(token: string): {
    userId: string;
    username: string;
    role: string;
  } {
    try {
      if (!token || token.trim().length === 0) {
        throw new InvalidTokenError('Token vacío');
      }

      const decoded = jwt.verify(token, this.accessTokenSecret) as jwt.JwtPayload;

      if (!decoded.userId || !decoded.username || !decoded.role) {
        this.logger.warn('Access token con payload incompleto', {
          hasUserId: !!decoded.userId,
          hasUsername: !!decoded.username,
          hasRole: !!decoded.role,
        });
        throw new InvalidTokenError('Token con payload incompleto');
      }

      this.logger.trace('Access token verificado exitosamente', {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      });

      return {
        userId: decoded.userId as string,
        username: decoded.username as string,
        role: decoded.role as string,
      };
    } catch (error) {
      // Manejar errores específicos de jsonwebtoken
      if (error instanceof jwt.TokenExpiredError) {
        this.logger.debug('Access token expirado', {
          expiredAt: error.expiredAt?.toISOString(),
        });
        throw new TokenExpiredError(`Token expirado el ${error.expiredAt?.toISOString()}`);
      }

      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn('Access token inválido', {
          error: error.message,
        });
        throw new InvalidTokenError(`Token inválido: ${error.message}`);
      }

      if (error instanceof jwt.NotBeforeError) {
        this.logger.warn('Access token usado antes de su fecha de validez', {
          date: error.date.toISOString(),
        });
        throw new InvalidTokenError(`Token no válido aún: ${error.date.toISOString()}`);
      }

      // Si ya es una excepción de dominio, re-lanzarla
      if (error instanceof InvalidTokenError || error instanceof TokenExpiredError) {
        throw error;
      }

      // Error desconocido
      this.logger.error('Error inesperado al verificar access token', error instanceof Error ? error : new Error(String(error)));
      throw new InvalidTokenError('Error al verificar token');
    }
  }

  /**
   * Verifica y decodifica un refresh token
   * @param token - Refresh token JWT a verificar
   * @returns Payload decodificado si el token es válido
   * @throws InvalidTokenError si el token es inválido
   * @throws TokenExpiredError si el token ha expirado
   */
  verifyRefreshToken(token: string): {
    userId: string;
  } {
    try {
      if (!token || token.trim().length === 0) {
        throw new InvalidTokenError('Token vacío');
      }

      const decoded = jwt.verify(token, this.refreshTokenSecret) as jwt.JwtPayload;

      if (!decoded.userId) {
        this.logger.warn('Refresh token con payload incompleto', {
          hasUserId: !!decoded.userId,
        });
        throw new InvalidTokenError('Token con payload incompleto');
      }

      this.logger.trace('Refresh token verificado exitosamente', {
        userId: decoded.userId,
      });

      return {
        userId: decoded.userId as string,
      };
    } catch (error) {
      // Manejar errores específicos de jsonwebtoken
      if (error instanceof jwt.TokenExpiredError) {
        this.logger.debug('Refresh token expirado', {
          expiredAt: error.expiredAt?.toISOString(),
        });
        throw new TokenExpiredError(`Token expirado el ${error.expiredAt?.toISOString()}`);
      }

      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn('Refresh token inválido', {
          error: error.message,
        });
        throw new InvalidTokenError(`Token inválido: ${error.message}`);
      }

      if (error instanceof jwt.NotBeforeError) {
        this.logger.warn('Refresh token usado antes de su fecha de validez', {
          date: error.date.toISOString(),
        });
        throw new InvalidTokenError(`Token no válido aún: ${error.date.toISOString()}`);
      }

      // Si ya es una excepción de dominio, re-lanzarla
      if (error instanceof InvalidTokenError || error instanceof TokenExpiredError) {
        throw error;
      }

      // Error desconocido
      this.logger.error('Error inesperado al verificar refresh token', error instanceof Error ? error : new Error(String(error)));
      throw new InvalidTokenError('Error al verificar token');
    }
  }

  /**
   * Decodifica un token sin verificar su firma
   * Útil para obtener información del token sin validarlo
   * @param token - Token JWT a decodificar
   * @returns Payload decodificado o null si no se puede decodificar
   */
  decodeToken(token: string): {
    userId?: string;
    username?: string;
    role?: string;
    exp?: number;
    iat?: number;
  } | null {
    try {
      if (!token || token.trim().length === 0) {
        return null;
      }

      const decoded = jwt.decode(token, { complete: false });

      if (!decoded || typeof decoded !== 'object') {
        return null;
      }

      // Extraer información relevante del payload
      const payload = decoded as jwt.JwtPayload;

      const result: {
        userId?: string;
        username?: string;
        role?: string;
        exp?: number;
        iat?: number;
      } = {};

      if (payload.userId !== undefined) {
        result.userId = payload.userId as string;
      }
      if (payload.username !== undefined) {
        result.username = payload.username as string;
      }
      if (payload.role !== undefined) {
        result.role = payload.role as string;
      }
      if (payload.exp !== undefined) {
        result.exp = payload.exp;
      }
      if (payload.iat !== undefined) {
        result.iat = payload.iat;
      }

      return result;
    } catch (error) {
      this.logger.debug('Error al decodificar token (sin verificar)', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }
}
