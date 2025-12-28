import { Router } from 'express';
import { ILogger } from '@shared/domain';
import { authenticate } from '@shared/infrastructure';
import { ITokenVerifier } from '@shared/infrastructure/http/middleware/types';
import { MinuteController } from './MinuteController';
// Reutilizar middlewares de documents
import { singleFileUpload, handleMulterError } from '@modules/documents/infrastructure/adapters/input/http/middleware';

/**
 * Configura las rutas HTTP para el módulo de minutas
 * 
 * @param controller - Instancia del MinuteController con casos de uso inyectados
 * @param tokenVerifier - Verificador de tokens (ITokenVerifier) para el middleware de autenticación
 * @param logger - Logger para los middlewares
 * @returns Router configurado con todas las rutas de minutas
 */
export function createMinuteRoutes(
  controller: MinuteController,
  tokenVerifier: ITokenVerifier,
  logger: ILogger
): Router {
  const router = Router();

  // Todas las rutas requieren autenticación
  const authMiddleware = authenticate(tokenVerifier, logger);

  // Middleware para upload de archivos (solo para POST /minutes)
  const fileUploadMiddleware = singleFileUpload(logger);

  // POST /minutes - Crear/subir minuta (con archivo)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post(
    '/',
    authMiddleware as any,
    fileUploadMiddleware as any,
    handleMulterError as any,
    controller.create.bind(controller) as any
  );

  // GET /minutes - Listar minutas con filtros
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/', authMiddleware as any, controller.list.bind(controller) as any);

  // GET /minutes/:id - Obtener minuta por ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/:id', authMiddleware as any, controller.getById.bind(controller) as any);

  // GET /minutes/:id/download - Obtener URL de descarga/visualización
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get(
    '/:id/download',
    authMiddleware as any,
    controller.getDownloadUrl.bind(controller) as any
  );

  // PUT /minutes/:id - Actualizar minuta completa (metadatos)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.put('/:id', authMiddleware as any, controller.update.bind(controller) as any);

  // PATCH /minutes/:id - Actualizar minuta parcial (metadatos)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.patch('/:id', authMiddleware as any, controller.partialUpdate.bind(controller) as any);

  // DELETE /minutes/:id - Eliminar minuta (baja lógica)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.delete('/:id', authMiddleware as any, controller.delete.bind(controller) as any);

  return router;
}
