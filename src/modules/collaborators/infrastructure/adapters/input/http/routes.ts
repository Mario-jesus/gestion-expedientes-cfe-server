import { Router } from 'express';
import { ILogger } from '@shared/domain';
import { authenticate } from '@shared/infrastructure';
import { ITokenVerifier } from '@shared/infrastructure/http/middleware/types';
import { CollaboratorController } from './CollaboratorController';

/**
 * Configura las rutas HTTP para el módulo de colaboradores
 * 
 * @param controller - Instancia del CollaboratorController con casos de uso inyectados
 * @param tokenVerifier - Verificador de tokens (ITokenVerifier) para el middleware de autenticación
 * @param logger - Logger para los middlewares
 * @returns Router configurado con todas las rutas de colaboradores
 */
export function createCollaboratorRoutes(
  controller: CollaboratorController,
  tokenVerifier: ITokenVerifier,
  logger: ILogger
): Router {
  const router = Router();

  // Todas las rutas requieren autenticación
  const authMiddleware = authenticate(tokenVerifier, logger);

  // POST /collaborators - Crear colaborador
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/', authMiddleware as any, controller.create.bind(controller) as any);

  // GET /collaborators - Listar colaboradores
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/', authMiddleware as any, controller.list.bind(controller) as any);

  // GET /collaborators/:id - Obtener colaborador por ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/:id', authMiddleware as any, controller.getById.bind(controller) as any);

  // PUT /collaborators/:id - Actualizar colaborador completo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.put('/:id', authMiddleware as any, controller.update.bind(controller) as any);

  // PATCH /collaborators/:id - Actualizar colaborador parcial
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.patch('/:id', authMiddleware as any, controller.partialUpdate.bind(controller) as any);

  // DELETE /collaborators/:id - Eliminar colaborador (baja lógica)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.delete('/:id', authMiddleware as any, controller.delete.bind(controller) as any);

  // POST /collaborators/:id/activate - Activar colaborador
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/:id/activate', authMiddleware as any, controller.activate.bind(controller) as any);

  // POST /collaborators/:id/deactivate - Desactivar colaborador
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post(
    '/:id/deactivate',
    authMiddleware as any,
    controller.deactivate.bind(controller) as any
  );

  return router;
}
