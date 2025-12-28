import { Router } from 'express';
import { ILogger } from '@shared/domain';
import { authenticate } from '@shared/infrastructure';
import { ITokenVerifier } from '@shared/infrastructure/http/middleware/types';
import { DocumentController } from './DocumentController';
import { singleFileUpload, handleMulterError } from './middleware';

/**
 * Configura las rutas HTTP para el módulo de documentos
 * 
 * @param controller - Instancia del DocumentController con casos de uso inyectados
 * @param tokenVerifier - Verificador de tokens (ITokenVerifier) para el middleware de autenticación
 * @param logger - Logger para los middlewares
 * @returns Router configurado con todas las rutas de documentos
 */
export function createDocumentRoutes(
  controller: DocumentController,
  tokenVerifier: ITokenVerifier,
  logger: ILogger
): Router {
  const router = Router();

  // Todas las rutas requieren autenticación
  const authMiddleware = authenticate(tokenVerifier, logger);

  // Middleware para upload de archivos (solo para POST /documents)
  const fileUploadMiddleware = singleFileUpload(logger);

  // POST /documents - Crear/subir documento (con archivo)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post(
    '/',
    authMiddleware as any,
    fileUploadMiddleware as any,
    handleMulterError as any,
    controller.create.bind(controller) as any
  );

  // GET /documents - Listar documentos con filtros
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/', authMiddleware as any, controller.list.bind(controller) as any);

  // GET /documents/:id - Obtener documento por ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/:id', authMiddleware as any, controller.getById.bind(controller) as any);

  // GET /documents/:id/download - Obtener URL de descarga/visualización
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get(
    '/:id/download',
    authMiddleware as any,
    controller.getDownloadUrl.bind(controller) as any
  );

  // PUT /documents/:id - Actualizar documento completo (metadatos)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.put('/:id', authMiddleware as any, controller.update.bind(controller) as any);

  // PATCH /documents/:id - Actualizar documento parcial (metadatos)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.patch('/:id', authMiddleware as any, controller.partialUpdate.bind(controller) as any);

  // DELETE /documents/:id - Eliminar documento (baja lógica)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.delete('/:id', authMiddleware as any, controller.delete.bind(controller) as any);

  return router;
}
