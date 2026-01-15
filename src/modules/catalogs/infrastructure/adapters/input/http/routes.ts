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

  /**
   * @swagger
   * /api/catalogs/areas:
   *   get:
   *     summary: Listar áreas
   *     description: Lista áreas con filtros y paginación. Todos los usuarios autenticados pueden listar áreas.
   *     tags: [Catálogos - Áreas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo/inactivo
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Búsqueda por nombre
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Límite de resultados por página
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Offset para paginación
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [nombre, createdAt]
   *         description: Campo para ordenar
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Orden ascendente o descendente
   *     responses:
   *       200:
   *         description: Lista de áreas
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       nombre:
   *                         type: string
   *                       descripcion:
   *                         type: string
   *                       isActive:
   *                         type: boolean
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *   post:
   *     summary: Crear área
   *     description: Crea una nueva área. Solo administradores pueden crear áreas.
   *     tags: [Catálogos - Áreas]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - nombre
   *             properties:
   *               nombre:
   *                 type: string
   *                 description: Nombre del área
   *                 example: Dirección General
   *               descripcion:
   *                 type: string
   *                 description: Descripción del área
   *                 example: Área administrativa principal
   *               isActive:
   *                 type: boolean
   *                 description: Estado activo (por defecto true)
   *                 example: true
   *     responses:
   *       201:
   *         description: Área creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 nombre:
   *                   type: string
   *                 descripcion:
   *                   type: string
   *                 isActive:
   *                   type: boolean
   *       400:
   *         description: Datos inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: No autorizado (solo admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: Área con ese nombre ya existe
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // GET /areas - Listar áreas (todos los usuarios autenticados)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/areas', authMiddleware as any, areaController.list.bind(areaController) as any);

  /**
   * @swagger
   * /api/catalogs/areas/{id}:
   *   get:
   *     summary: Obtener área por ID
   *     description: Obtiene la información de un área específica.
   *     tags: [Catálogos - Áreas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del área
   *     responses:
   *       200:
   *         description: Información del área
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 nombre:
   *                   type: string
   *                 descripcion:
   *                   type: string
   *                 isActive:
   *                   type: boolean
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: Área no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   put:
   *     summary: Actualizar área
   *     description: Actualiza un área existente. Solo administradores pueden actualizar áreas.
   *     tags: [Catálogos - Áreas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del área
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nombre:
   *                 type: string
   *               descripcion:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Área actualizada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 nombre:
   *                   type: string
   *                 descripcion:
   *                   type: string
   *                 isActive:
   *                   type: boolean
   *       403:
   *         description: No autorizado (solo admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Área no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   delete:
   *     summary: Eliminar área
   *     description: Elimina un área (baja lógica). Solo administradores pueden eliminar áreas.
   *     tags: [Catálogos - Áreas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del área
   *     responses:
   *       200:
   *         description: Área eliminada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Área eliminada exitosamente
   *       403:
   *         description: No autorizado (solo admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Área no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       400:
   *         description: No se puede eliminar porque tiene colaboradores asociados
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   * /api/catalogs/areas/{id}/activate:
   *   post:
   *     summary: Activar área
   *     description: Activa un área desactivada. Solo administradores pueden activar áreas.
   *     tags: [Catálogos - Áreas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del área
   *     responses:
   *       200:
   *         description: Área activada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 nombre:
   *                   type: string
   *                 isActive:
   *                   type: boolean
   *                   example: true
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *       403:
   *         description: No autorizado (solo admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Área no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   * /api/catalogs/areas/{id}/deactivate:
   *   post:
   *     summary: Desactivar área
   *     description: Desactiva un área (baja lógica). Solo administradores pueden desactivar áreas.
   *     tags: [Catálogos - Áreas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del área
   *     responses:
   *       200:
   *         description: Área desactivada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 nombre:
   *                   type: string
   *                 isActive:
   *                   type: boolean
   *                   example: false
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *       403:
   *         description: No autorizado (solo admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Área no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
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

  /**
   * @swagger
   * /api/catalogs/adscripciones:
   *   get:
   *     summary: Listar adscripciones
   *     description: Lista adscripciones con filtros y paginación. Todos los usuarios autenticados pueden listar adscripciones.
   *     tags: [Catálogos - Adscripciones]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo/inactivo
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Búsqueda por nombre
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Límite de resultados por página
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Offset para paginación
   *     responses:
   *       200:
   *         description: Lista de adscripciones
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       nombre:
   *                         type: string
   *                       adscripcion:
   *                         type: string
   *                       descripcion:
   *                         type: string
   *                       isActive:
   *                         type: boolean
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *   post:
   *     summary: Crear adscripción
   *     description: Crea una nueva adscripción. Solo administradores pueden crear adscripciones.
   *     tags: [Catálogos - Adscripciones]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - nombre
   *               - adscripcion
   *             properties:
   *               nombre:
   *                 type: string
   *                 description: Nombre de la adscripción
   *                 example: Central Hidroeléctrica
   *               adscripcion:
   *                 type: string
   *                 description: Texto de la adscripción (campo libre)
   *                 example: Central Hidroeléctrica Manuel Moreno Torres
   *               descripcion:
   *                 type: string
   *                 description: Descripción de la adscripción
   *               isActive:
   *                 type: boolean
   *                 description: Estado activo (por defecto true)
   *                 example: true
   *     responses:
   *       201:
   *         description: Adscripción creada exitosamente
   *       400:
   *         description: Datos inválidos
   *       403:
   *         description: No autorizado (solo admin)
   *       409:
   *         description: Adscripción con ese nombre ya existe
   */
  // GET /adscripciones - Listar adscripciones (todos los usuarios autenticados)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/adscripciones', authMiddleware as any, adscripcionController.list.bind(adscripcionController) as any);

  /**
   * @swagger
   * /api/catalogs/adscripciones/{id}:
   *   get:
   *     summary: Obtener adscripción por ID
   *     description: Obtiene la información de una adscripción específica.
   *     tags: [Catálogos - Adscripciones]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la adscripción
   *     responses:
   *       200:
   *         description: Información de la adscripción
   *       404:
   *         description: Adscripción no encontrada
   *   put:
   *     summary: Actualizar adscripción
   *     description: Actualiza una adscripción existente. Solo administradores pueden actualizar adscripciones.
   *     tags: [Catálogos - Adscripciones]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la adscripción
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nombre:
   *                 type: string
   *               adscripcion:
   *                 type: string
   *               descripcion:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Adscripción actualizada exitosamente
   *       403:
   *         description: No autorizado (solo admin)
   *       404:
   *         description: Adscripción no encontrada
   *   delete:
   *     summary: Eliminar adscripción
   *     description: Elimina una adscripción (baja lógica). Solo administradores pueden eliminar adscripciones.
   *     tags: [Catálogos - Adscripciones]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la adscripción
   *     responses:
   *       200:
   *         description: Adscripción eliminada exitosamente
   *       400:
   *         description: No se puede eliminar porque tiene colaboradores asociados
   *       403:
   *         description: No autorizado (solo admin)
   *       404:
   *         description: Adscripción no encontrada
   * /api/catalogs/adscripciones/{id}/activate:
   *   post:
   *     summary: Activar adscripción
   *     description: Activa una adscripción desactivada. Solo administradores pueden activar adscripciones.
   *     tags: [Catálogos - Adscripciones]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la adscripción
   *     responses:
   *       200:
   *         description: Adscripción activada exitosamente
   *       403:
   *         description: No autorizado (solo admin)
   *       404:
   *         description: Adscripción no encontrada
   * /api/catalogs/adscripciones/{id}/deactivate:
   *   post:
   *     summary: Desactivar adscripción
   *     description: Desactiva una adscripción (baja lógica). Solo administradores pueden desactivar adscripciones.
   *     tags: [Catálogos - Adscripciones]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la adscripción
   *     responses:
   *       200:
   *         description: Adscripción desactivada exitosamente
   *       403:
   *         description: No autorizado (solo admin)
   *       404:
   *         description: Adscripción no encontrada
   */
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

  /**
   * @swagger
   * /api/catalogs/puestos:
   *   get:
   *     summary: Listar puestos
   *     description: Lista puestos con filtros y paginación. Todos los usuarios autenticados pueden listar puestos.
   *     tags: [Catálogos - Puestos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo/inactivo
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Búsqueda por nombre
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *     responses:
   *       200:
   *         description: Lista de puestos
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       nombre:
   *                         type: string
   *                       descripcion:
   *                         type: string
   *                       isActive:
   *                         type: boolean
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *   post:
   *     summary: Crear puesto
   *     description: Crea un nuevo puesto. Solo administradores pueden crear puestos.
   *     tags: [Catálogos - Puestos]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - nombre
   *             properties:
   *               nombre:
   *                 type: string
   *                 example: Ingeniero de Sistemas
   *               descripcion:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *                 example: true
   *     responses:
   *       201:
   *         description: Puesto creado exitosamente
   *       400:
   *         description: Datos inválidos
   *       403:
   *         description: No autorizado (solo admin)
   *       409:
   *         description: Puesto con ese nombre ya existe
   * /api/catalogs/puestos/{id}:
   *   get:
   *     summary: Obtener puesto por ID
   *     tags: [Catálogos - Puestos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Información del puesto
   *       404:
   *         description: Puesto no encontrado
   *   put:
   *     summary: Actualizar puesto
   *     description: Solo administradores pueden actualizar puestos.
   *     tags: [Catálogos - Puestos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nombre:
   *                 type: string
   *               descripcion:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Puesto actualizado exitosamente
   *       403:
   *         description: No autorizado (solo admin)
   *       404:
   *         description: Puesto no encontrado
   *   delete:
   *     summary: Eliminar puesto
   *     description: Solo administradores pueden eliminar puestos.
   *     tags: [Catálogos - Puestos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Puesto eliminado exitosamente
   *       400:
   *         description: No se puede eliminar porque tiene colaboradores asociados
   *       403:
   *         description: No autorizado (solo admin)
   *       404:
   *         description: Puesto no encontrado
   * /api/catalogs/puestos/{id}/activate:
   *   post:
   *     summary: Activar puesto
   *     description: Solo administradores pueden activar puestos.
   *     tags: [Catálogos - Puestos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Puesto activado exitosamente
   *       403:
   *         description: No autorizado (solo admin)
   *       404:
   *         description: Puesto no encontrado
   * /api/catalogs/puestos/{id}/deactivate:
   *   post:
   *     summary: Desactivar puesto
   *     description: Solo administradores pueden desactivar puestos.
   *     tags: [Catálogos - Puestos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Puesto desactivado exitosamente
   *       403:
   *         description: No autorizado (solo admin)
   *       404:
   *         description: Puesto no encontrado
   */
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

  /**
   * @swagger
   * /api/catalogs/document-types:
   *   get:
   *     summary: Listar tipos de documento
   *     description: Lista tipos de documento con filtros y paginación. Todos los usuarios autenticados pueden listar tipos de documento.
   *     tags: [Catálogos - Tipos de Documento]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: kind
   *         schema:
   *           type: string
   *           enum: [bateria, historial, perfil, constancia, otro]
   *         description: Filtrar por tipo principal
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo/inactivo
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *     responses:
   *       200:
   *         description: Lista de tipos de documento
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       nombre:
   *                         type: string
   *                       kind:
   *                         type: string
   *                         enum: [bateria, historial, perfil, constancia, otro]
   *                       descripcion:
   *                         type: string
   *                       isActive:
   *                         type: boolean
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *   post:
   *     summary: Crear tipo de documento
   *     description: Crea un nuevo tipo de documento. Solo administradores pueden crear tipos de documento.
   *     tags: [Catálogos - Tipos de Documento]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - nombre
   *               - kind
   *             properties:
   *               nombre:
   *                 type: string
   *                 example: Identificación Oficial
   *               kind:
   *                 type: string
   *                 enum: [bateria, historial, perfil, constancia, otro]
   *                 example: otro
   *               descripcion:
   *                 type: string
   *                 example: INE, Pasaporte, etc.
   *               isActive:
   *                 type: boolean
   *                 example: true
   *     responses:
   *       201:
   *         description: Tipo de documento creado exitosamente
   *       400:
   *         description: Datos inválidos
   *       403:
   *         description: No autorizado (solo admin)
   *       409:
   *         description: Tipo de documento con ese nombre ya existe en el kind
   * /api/catalogs/document-types/{id}:
   *   get:
   *     summary: Obtener tipo de documento por ID
   *     tags: [Catálogos - Tipos de Documento]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Información del tipo de documento
   *       404:
   *         description: Tipo de documento no encontrado
   *   put:
   *     summary: Actualizar tipo de documento
   *     description: Solo administradores pueden actualizar tipos de documento.
   *     tags: [Catálogos - Tipos de Documento]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nombre:
   *                 type: string
   *               descripcion:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Tipo de documento actualizado exitosamente
   *       403:
   *         description: No autorizado (solo admin)
   *       404:
   *         description: Tipo de documento no encontrado
   *   delete:
   *     summary: Eliminar tipo de documento
   *     description: Solo administradores pueden eliminar tipos de documento.
   *     tags: [Catálogos - Tipos de Documento]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Tipo de documento eliminado exitosamente
   *       400:
   *         description: No se puede eliminar porque tiene documentos asociados
   *       403:
   *         description: No autorizado (solo admin)
   *       404:
   *         description: Tipo de documento no encontrado
   * /api/catalogs/document-types/{id}/activate:
   *   post:
   *     summary: Activar tipo de documento
   *     description: Solo administradores pueden activar tipos de documento.
   *     tags: [Catálogos - Tipos de Documento]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Tipo de documento activado exitosamente
   *       403:
   *         description: No autorizado (solo admin)
   *       404:
   *         description: Tipo de documento no encontrado
   * /api/catalogs/document-types/{id}/deactivate:
   *   post:
   *     summary: Desactivar tipo de documento
   *     description: Solo administradores pueden desactivar tipos de documento.
   *     tags: [Catálogos - Tipos de Documento]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Tipo de documento desactivado exitosamente
   *       403:
   *         description: No autorizado (solo admin)
   *       404:
   *         description: Tipo de documento no encontrado
   */
  // GET /document-types - Listar tipos de documento (todos los usuarios autenticados)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/document-types', authMiddleware as any, documentTypeController.list.bind(documentTypeController) as any);

  // GET /document-types/:id - Obtener tipo de documento por ID (todos los usuarios autenticados)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/document-types/:id', authMiddleware as any, documentTypeController.getById.bind(documentTypeController) as any);

  // POST /document-types - Crear tipo de documento (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/document-types', authMiddleware as any, adminOnly as any, documentTypeController.create.bind(documentTypeController) as any);

  // PUT /document-types/:id - Actualizar tipo de documento (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.put('/document-types/:id', authMiddleware as any, adminOnly as any, documentTypeController.update.bind(documentTypeController) as any);

  // DELETE /document-types/:id - Eliminar tipo de documento (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.delete('/document-types/:id', authMiddleware as any, adminOnly as any, documentTypeController.delete.bind(documentTypeController) as any);

  // POST /document-types/:id/activate - Activar tipo de documento (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/document-types/:id/activate', authMiddleware as any, adminOnly as any, documentTypeController.activate.bind(documentTypeController) as any);

  // POST /document-types/:id/deactivate - Desactivar tipo de documento (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/document-types/:id/deactivate', authMiddleware as any, adminOnly as any, documentTypeController.deactivate.bind(documentTypeController) as any);

  return router;
}
