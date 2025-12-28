import { Router } from 'express';
import { ILogger } from '@shared/domain';
import { authenticate, authorize } from '@shared/infrastructure';
import { ITokenVerifier } from '@shared/infrastructure/http/middleware/types';
import { UserRole } from '@modules/users/domain/enums/UserRole';
import { UserController } from './UserController';
import { allowSelfOrAdmin } from './middleware/allowSelfOrAdmin';

/**
 * Configura las rutas HTTP para el módulo de usuarios
 * 
 * @param controller - Instancia del UserController con casos de uso inyectados
 * @param tokenVerifier - Verificador de tokens (ITokenVerifier) para el middleware de autenticación
 * @param logger - Logger para los middlewares
 * @returns Router configurado con todas las rutas de usuarios
 */
export function createUserRoutes(
  controller: UserController,
  tokenVerifier: ITokenVerifier,
  logger: ILogger
): Router {
  const router = Router();

  // Todas las rutas requieren autenticación
  const authMiddleware = authenticate(tokenVerifier, logger);
  const adminOnly = authorize([UserRole.ADMIN] as string[], logger);
  const allowSelfOrAdminMiddleware = allowSelfOrAdmin(logger);

  // POST /users - Crear usuario (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/', authMiddleware as any, adminOnly as any, controller.create.bind(controller) as any);

  // GET /users - Listar usuarios (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/', authMiddleware as any, adminOnly as any, controller.list.bind(controller) as any);

  // GET /users/:id - Obtener usuario por ID (mismo usuario o admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/:id', authMiddleware as any, allowSelfOrAdminMiddleware as any, controller.getById.bind(controller) as any);

  // PUT /users/:id - Actualizar usuario completo (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.put('/:id', authMiddleware as any, adminOnly as any, controller.update.bind(controller) as any);

  // PATCH /users/:id - Actualizar usuario parcial (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.patch('/:id', authMiddleware as any, adminOnly as any, controller.partialUpdate.bind(controller) as any);

  // DELETE /users/:id - Eliminar usuario (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.delete('/:id', authMiddleware as any, adminOnly as any, controller.delete.bind(controller) as any);

  // POST /users/:id/activate - Activar usuario (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/:id/activate', authMiddleware as any, adminOnly as any, controller.activate.bind(controller) as any);

  // POST /users/:id/deactivate - Desactivar usuario (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/:id/deactivate', authMiddleware as any, adminOnly as any, controller.deactivate.bind(controller) as any);

  // POST /users/:id/change-password - Cambiar contraseña (mismo usuario o admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/:id/change-password', authMiddleware as any, allowSelfOrAdminMiddleware as any, controller.changePassword.bind(controller) as any);

  return router;
}
