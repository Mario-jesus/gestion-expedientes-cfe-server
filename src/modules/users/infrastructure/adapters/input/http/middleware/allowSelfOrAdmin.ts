import { Response, NextFunction } from 'express';
import { ILogger } from '@shared/domain';
import { AuthenticatedRequest } from '@shared/infrastructure';
import { UserRole } from '@modules/users/domain/enums/UserRole';

/**
 * Middleware que permite acceso si el usuario es administrador
 * o si está accediendo a su propio recurso (mismo ID)
 * 
 * IMPORTANTE: Este middleware debe usarse DESPUÉS del middleware authenticate
 * porque depende de req.user que es establecido por authenticate
 * 
 * Uso:
 * ```typescript
 * router.post('/users/:id/change-password', 
 *   authenticate, 
 *   allowSelfOrAdmin(logger), 
 *   controller.changePassword
 * );
 * ```
 * 
 * @param logger - Logger para registrar intentos de acceso
 */
export function allowSelfOrAdmin(logger: ILogger) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Verificar que el usuario esté autenticado (debe estar presente por el middleware authenticate)
      if (!req.user) {
        logger.error('Middleware allowSelfOrAdmin usado sin authenticate', undefined, {
          path: req.path,
          method: req.method,
        });

        res.status(500).json({
          error: 'Error de configuración: middleware allowSelfOrAdmin requiere authenticate',
          code: 'MIDDLEWARE_CONFIG_ERROR',
        });
        return;
      }

      const userId = req.user.id;
      const userRole = req.user.role as UserRole;
      const resourceId = req.params.id as string;

      // Si es administrador, permitir acceso
      if (userRole === UserRole.ADMIN) {
        logger.debug('Acceso permitido: usuario es administrador', {
          userId,
          resourceId,
          path: req.path,
          method: req.method,
        });
        next();
        return;
      }

      // Si el usuario está accediendo a su propio recurso, permitir acceso
      if (userId === resourceId) {
        logger.debug('Acceso permitido: usuario accediendo a su propio recurso', {
          userId,
          resourceId,
          path: req.path,
          method: req.method,
        });
        next();
        return;
      }

      // Si no es admin ni el mismo usuario, denegar acceso
      logger.warn('Intento de acceso no autorizado: no es admin ni el mismo usuario', {
        userId,
        userRole,
        resourceId,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(403).json({
        error: 'No tienes permisos para acceder a este recurso',
        code: 'FORBIDDEN',
        message: 'Solo puedes acceder a tu propio recurso o debes ser administrador',
      });
    } catch (error) {
      logger.error('Error inesperado en middleware allowSelfOrAdmin', error instanceof Error ? error : new Error(String(error)), {
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
