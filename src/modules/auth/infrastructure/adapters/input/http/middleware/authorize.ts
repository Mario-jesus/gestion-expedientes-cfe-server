import { Response, NextFunction } from 'express';
import { ILogger } from '@shared/domain';
import { AuthenticatedRequest } from '@shared/infrastructure';

/**
 * Middleware de autorización que verifica que el usuario tenga uno de los roles permitidos
 * 
 * IMPORTANTE: Este middleware debe usarse DESPUÉS del middleware authenticate
 * porque depende de req.user que es establecido por authenticate
 * 
 * Uso:
 * ```typescript
 * router.get('/admin-only', authenticate, authorize(['admin']), controller.method);
 * router.get('/admin-or-manager', authenticate, authorize(['admin', 'manager']), controller.method);
 * ```
 * 
 * @param allowedRoles - Array de roles permitidos
 */
export function authorize(allowedRoles: string[], logger: ILogger) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Verificar que el usuario esté autenticado (debe estar presente por el middleware authenticate)
      if (!req.user) {
        logger.error('Middleware authorize usado sin authenticate', undefined, {
          path: req.path,
          method: req.method,
        });

        res.status(500).json({
          error: 'Error de configuración: middleware authorize requiere authenticate',
          code: 'MIDDLEWARE_CONFIG_ERROR',
        });
        return;
      }

      const userRole = req.user.role;

      // Verificar que el rol del usuario esté en la lista de roles permitidos
      if (!allowedRoles.includes(userRole)) {
        logger.warn('Intento de acceso no autorizado', {
          userId: req.user.id,
          username: req.user.username,
          userRole,
          allowedRoles,
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });

        res.status(403).json({
          error: 'No tienes permisos para acceder a este recurso',
          code: 'FORBIDDEN',
          requiredRoles: allowedRoles,
          userRole,
        });
        return;
      }

      logger.debug('Acceso autorizado', {
        userId: req.user.id,
        username: req.user.username,
        role: userRole,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      logger.error('Error inesperado en middleware authorize', error instanceof Error ? error : new Error(String(error)), {
        path: req.path,
        method: req.method,
      });

      res.status(500).json({
        error: 'Error interno al verificar autorización',
        code: 'AUTHORIZATION_ERROR',
      });
    }
  };
}

