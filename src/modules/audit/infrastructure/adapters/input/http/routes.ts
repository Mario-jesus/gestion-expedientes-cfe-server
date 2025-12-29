import { Router } from 'express';
import { ILogger } from '@shared/domain';
import { authenticate } from '@shared/infrastructure';
import { ITokenVerifier } from '@shared/infrastructure/http/middleware/types';
import { LogEntryController } from './LogEntryController';

/**
 * Configura las rutas HTTP para el módulo de auditoría
 * 
 * @param controller - Instancia del LogEntryController con casos de uso inyectados
 * @param tokenVerifier - Verificador de tokens (ITokenVerifier) para el middleware de autenticación
 * @param logger - Logger para los middlewares
 * @returns Router configurado con todas las rutas de auditoría
 */
export function createAuditRoutes(
  controller: LogEntryController,
  tokenVerifier: ITokenVerifier,
  logger: ILogger
): Router {
  const router = Router();

  // Todas las rutas requieren autenticación
  const authMiddleware = authenticate(tokenVerifier, logger);

  // GET /audit - Listar logs con filtros
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/', authMiddleware as any, controller.list.bind(controller) as any);

  // GET /audit/entity/:entity/:entityId - Obtener logs de una entidad específica
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get(
    '/entity/:entity/:entityId',
    authMiddleware as any,
    controller.getByEntity.bind(controller) as any
  );

  // GET /audit/user/:userId - Obtener logs de un usuario específico
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get(
    '/user/:userId',
    authMiddleware as any,
    controller.getByUserId.bind(controller) as any
  );

  // GET /audit/:id - Obtener log por ID (debe ir al final para no interferir con rutas específicas)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/:id', authMiddleware as any, controller.getById.bind(controller) as any);

  return router;
}
