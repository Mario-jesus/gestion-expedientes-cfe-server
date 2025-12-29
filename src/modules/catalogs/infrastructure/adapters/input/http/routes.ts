import { Router } from 'express';
import { ILogger } from '@shared/domain';
import { authenticate, authorize } from '@shared/infrastructure';
import { ITokenVerifier } from '@shared/infrastructure/http/middleware/types';
import { UserRole } from '@modules/users/domain/enums/UserRole';
import { AreaController } from './AreaController';
import { AdscripcionController } from './AdscripcionController';
import { PuestoController } from './PuestoController';
import { DocumentTypeController } from './DocumentTypeController';

/**
 * Configura las rutas HTTP para el módulo de catálogos
 * 
 * @param areaController - Instancia del AreaController
 * @param adscripcionController - Instancia del AdscripcionController
 * @param puestoController - Instancia del PuestoController
 * @param documentTypeController - Instancia del DocumentTypeController
 * @param tokenVerifier - Verificador de tokens (ITokenVerifier) para el middleware de autenticación
 * @param logger - Logger para los middlewares
 * @returns Router configurado con todas las rutas de catálogos
 */
export function createCatalogRoutes(
  areaController: AreaController,
  adscripcionController: AdscripcionController,
  puestoController: PuestoController,
  documentTypeController: DocumentTypeController,
  tokenVerifier: ITokenVerifier,
  logger: ILogger
): Router {
  const router = Router();

  // Todas las rutas requieren autenticación
  const authMiddleware = authenticate(tokenVerifier, logger);
  const adminOnly = authorize([UserRole.ADMIN] as string[], logger);

  // ============================================
  // RUTAS DE ÁREAS
  // ============================================

  // GET /areas - Listar áreas (todos los usuarios autenticados)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/areas', authMiddleware as any, areaController.list.bind(areaController) as any);

  // GET /areas/:id/adscripciones - Obtener adscripciones del área
  // IMPORTANTE: Esta ruta debe ir antes de GET /areas/:id para evitar que "adscripciones" sea interpretado como un ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get(
    '/areas/:id/adscripciones',
    authMiddleware as any,
    areaController.getAdscripciones.bind(areaController) as any
  );

  // GET /areas/:id - Obtener área por ID (todos los usuarios autenticados)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/areas/:id', authMiddleware as any, areaController.getById.bind(areaController) as any);

  // POST /areas - Crear área (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/areas', authMiddleware as any, adminOnly as any, areaController.create.bind(areaController) as any);

  // PUT /areas/:id - Actualizar área (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.put('/areas/:id', authMiddleware as any, adminOnly as any, areaController.update.bind(areaController) as any);

  // DELETE /areas/:id - Eliminar área (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.delete('/areas/:id', authMiddleware as any, adminOnly as any, areaController.delete.bind(areaController) as any);

  // POST /areas/:id/activate - Activar área (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/areas/:id/activate', authMiddleware as any, adminOnly as any, areaController.activate.bind(areaController) as any);

  // POST /areas/:id/deactivate - Desactivar área (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/areas/:id/deactivate', authMiddleware as any, adminOnly as any, areaController.deactivate.bind(areaController) as any);

  // ============================================
  // RUTAS DE ADSCRIPCIONES
  // ============================================

  // GET /adscripciones - Listar adscripciones (todos los usuarios autenticados)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/adscripciones', authMiddleware as any, adscripcionController.list.bind(adscripcionController) as any);

  // GET /adscripciones/:id - Obtener adscripción por ID (todos los usuarios autenticados)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/adscripciones/:id', authMiddleware as any, adscripcionController.getById.bind(adscripcionController) as any);

  // POST /adscripciones - Crear adscripción (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/adscripciones', authMiddleware as any, adminOnly as any, adscripcionController.create.bind(adscripcionController) as any);

  // PUT /adscripciones/:id - Actualizar adscripción (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.put('/adscripciones/:id', authMiddleware as any, adminOnly as any, adscripcionController.update.bind(adscripcionController) as any);

  // DELETE /adscripciones/:id - Eliminar adscripción (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.delete('/adscripciones/:id', authMiddleware as any, adminOnly as any, adscripcionController.delete.bind(adscripcionController) as any);

  // POST /adscripciones/:id/activate - Activar adscripción (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/adscripciones/:id/activate', authMiddleware as any, adminOnly as any, adscripcionController.activate.bind(adscripcionController) as any);

  // POST /adscripciones/:id/deactivate - Desactivar adscripción (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/adscripciones/:id/deactivate', authMiddleware as any, adminOnly as any, adscripcionController.deactivate.bind(adscripcionController) as any);

  // ============================================
  // RUTAS DE PUESTOS
  // ============================================

  // GET /puestos - Listar puestos (todos los usuarios autenticados)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/puestos', authMiddleware as any, puestoController.list.bind(puestoController) as any);

  // GET /puestos/:id - Obtener puesto por ID (todos los usuarios autenticados)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/puestos/:id', authMiddleware as any, puestoController.getById.bind(puestoController) as any);

  // POST /puestos - Crear puesto (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/puestos', authMiddleware as any, adminOnly as any, puestoController.create.bind(puestoController) as any);

  // PUT /puestos/:id - Actualizar puesto (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.put('/puestos/:id', authMiddleware as any, adminOnly as any, puestoController.update.bind(puestoController) as any);

  // DELETE /puestos/:id - Eliminar puesto (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.delete('/puestos/:id', authMiddleware as any, adminOnly as any, puestoController.delete.bind(puestoController) as any);

  // POST /puestos/:id/activate - Activar puesto (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/puestos/:id/activate', authMiddleware as any, adminOnly as any, puestoController.activate.bind(puestoController) as any);

  // POST /puestos/:id/deactivate - Desactivar puesto (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/puestos/:id/deactivate', authMiddleware as any, adminOnly as any, puestoController.deactivate.bind(puestoController) as any);

  // ============================================
  // RUTAS DE TIPOS DE DOCUMENTO
  // ============================================

  // GET /documentTypes - Listar tipos de documento (todos los usuarios autenticados)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/documentTypes', authMiddleware as any, documentTypeController.list.bind(documentTypeController) as any);

  // GET /documentTypes/:id - Obtener tipo de documento por ID (todos los usuarios autenticados)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/documentTypes/:id', authMiddleware as any, documentTypeController.getById.bind(documentTypeController) as any);

  // POST /documentTypes - Crear tipo de documento (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/documentTypes', authMiddleware as any, adminOnly as any, documentTypeController.create.bind(documentTypeController) as any);

  // PUT /documentTypes/:id - Actualizar tipo de documento (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.put('/documentTypes/:id', authMiddleware as any, adminOnly as any, documentTypeController.update.bind(documentTypeController) as any);

  // DELETE /documentTypes/:id - Eliminar tipo de documento (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.delete('/documentTypes/:id', authMiddleware as any, adminOnly as any, documentTypeController.delete.bind(documentTypeController) as any);

  // POST /documentTypes/:id/activate - Activar tipo de documento (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/documentTypes/:id/activate', authMiddleware as any, adminOnly as any, documentTypeController.activate.bind(documentTypeController) as any);

  // POST /documentTypes/:id/deactivate - Desactivar tipo de documento (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/documentTypes/:id/deactivate', authMiddleware as any, adminOnly as any, documentTypeController.deactivate.bind(documentTypeController) as any);

  return router;
}
