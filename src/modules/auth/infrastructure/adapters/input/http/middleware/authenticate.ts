import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@shared/domain';
import { ITokenService } from '@modules/auth/domain/ports/output/ITokenService';
import { InvalidTokenError, TokenExpiredError } from '@modules/auth/domain/exceptions';
import { AuthenticatedRequest } from '@shared/infrastructure';

/**
 * Middleware de autenticación que verifica y valida tokens JWT
 * 
 * Extrae el token del header Authorization (Bearer token)
 * Verifica el token usando el TokenService
 * Adjunta la información del usuario al request (req.user)
 * 
 * Si el token es inválido o expirado, retorna 401 Unauthorized
 */
export function authenticate(tokenService: ITokenService, logger: ILogger) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.trace('Iniciando autenticación de request', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Extraer token del header Authorization
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        logger.debug('Request sin header Authorization', {
          path: req.path,
          method: req.method,
          ip: req.ip,
        });
        res.status(401).json({
          error: 'Token de autenticación requerido',
          code: 'AUTH_TOKEN_REQUIRED',
        });
        return;
      }

      // Verificar formato Bearer token
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        logger.debug('Formato de Authorization header inválido', {
          path: req.path,
          method: req.method,
          ip: req.ip,
        });
        res.status(401).json({
          error: 'Formato de token inválido. Use: Bearer {token}',
          code: 'INVALID_TOKEN_FORMAT',
        });
        return;
      }

      const token = parts[1]!;

      logger.trace('Token extraído, verificando validez', {
        path: req.path,
        method: req.method,
        tokenPreview: token.substring(0, 20) + '...',
      });

      // Verificar token
      const payload = tokenService.verifyAccessToken(token);

      logger.debug('Token verificado exitosamente', {
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
        path: req.path,
        method: req.method,
      });

      // Adjuntar información del usuario al request
      // Usamos type assertion porque Express no tiene tipos genéricos para Request
      const authenticatedReq = req as unknown as AuthenticatedRequest;
      authenticatedReq.user = {
        id: payload.userId,
        username: payload.username,
        role: payload.role,
      };

      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        logger.warn('Intento de acceso con token expirado', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        res.status(401).json({
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED',
        });
        return;
      }

      if (error instanceof InvalidTokenError) {
        logger.warn('Intento de acceso con token inválido', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        res.status(401).json({
          error: 'Token inválido',
          code: 'INVALID_TOKEN',
        });
        return;
      }

      // Error inesperado
      logger.error('Error inesperado en middleware de autenticación', error as Error, {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}
