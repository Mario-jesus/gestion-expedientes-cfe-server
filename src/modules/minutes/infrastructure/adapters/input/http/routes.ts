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

  /**
   * @swagger
   * /api/minutes:
   *   post:
   *     summary: Crear/subir minuta
   *     description: Crea una nueva minuta con upload de archivo. El archivo se envía como multipart/form-data.
   *     tags: [Minutas]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - file
   *               - titulo
   *               - tipo
   *               - fecha
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: Archivo de la minuta (PDF, DOC, DOCX, XLS, XLSX, imágenes)
   *               titulo:
   *                 type: string
   *                 description: Título de la minuta
   *                 example: Minuta de Reunión de Dirección - Enero 2024
   *               tipo:
   *                 type: string
   *                 enum: [reunion, junta, acuerdo, memorandum, otro]
   *                 description: Tipo de minuta
   *                 example: reunion
   *               fecha:
   *                 type: string
   *                 format: date-time
   *                 description: Fecha del evento (ISO 8601)
   *                 example: 2024-01-15T10:00:00Z
   *               descripcion:
   *                 type: string
   *                 description: Descripción adicional de la minuta (opcional)
   *                 example: Reunión mensual de seguimiento de proyectos
   *     responses:
   *       201:
   *         description: Minuta creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 titulo:
   *                   type: string
   *                 tipo:
   *                   type: string
   *                 fecha:
   *                   type: string
   *                   format: date-time
   *                 descripcion:
   *                   type: string
   *                 fileName:
   *                   type: string
   *                 fileUrl:
   *                   type: string
   *                 fileSize:
   *                   type: number
   *                 fileType:
   *                   type: string
   *                 isActive:
   *                   type: boolean
   *                 uploadedAt:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: Datos inválidos o archivo requerido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   get:
   *     summary: Listar minutas
   *     description: Lista minutas con filtros y paginación. Todos los usuarios autenticados pueden listar minutas.
   *     tags: [Minutas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: tipo
   *         schema:
   *           type: string
   *           enum: [reunion, junta, acuerdo, memorandum, otro]
   *         description: Filtrar por tipo de minuta
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo/inactivo
   *       - in: query
   *         name: fechaDesde
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filtrar desde esta fecha (ISO 8601)
   *         example: 2024-01-01T00:00:00Z
   *       - in: query
   *         name: fechaHasta
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filtrar hasta esta fecha (ISO 8601)
   *         example: 2024-12-31T23:59:59Z
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Búsqueda por título o descripción
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
   *           enum: [createdAt, fecha, titulo, uploadedAt]
   *           default: createdAt
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
   *         description: Lista de minutas
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
   *                       titulo:
   *                         type: string
   *                       tipo:
   *                         type: string
   *                       fecha:
   *                         type: string
   *                         format: date-time
   *                       descripcion:
   *                         type: string
   *                       fileName:
   *                         type: string
   *                       fileUrl:
   *                         type: string
   *                       fileSize:
   *                         type: number
   *                       fileType:
   *                         type: string
   *                       isActive:
   *                         type: boolean
   *                       uploadedAt:
   *                         type: string
   *                         format: date-time
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   */
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

  /**
   * @swagger
   * /api/minutes/{id}:
   *   get:
   *     summary: Obtener minuta por ID
   *     description: Obtiene la información de una minuta específica.
   *     tags: [Minutas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la minuta
   *     responses:
   *       200:
   *         description: Información de la minuta
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 titulo:
   *                   type: string
   *                 tipo:
   *                   type: string
   *                 fecha:
   *                   type: string
   *                   format: date-time
   *                 descripcion:
   *                   type: string
   *                 fileName:
   *                   type: string
   *                 fileUrl:
   *                   type: string
   *                 fileSize:
   *                   type: number
   *                 fileType:
   *                   type: string
   *                 isActive:
   *                   type: boolean
   *                 uploadedAt:
   *                   type: string
   *                   format: date-time
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: Minuta no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   put:
   *     summary: Actualizar minuta completa
   *     description: Actualiza los metadatos de una minuta. No se puede cambiar el archivo, solo metadatos (titulo, tipo, fecha, descripcion, isActive).
   *     tags: [Minutas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la minuta
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               titulo:
   *                 type: string
   *                 description: Título de la minuta
   *               tipo:
   *                 type: string
   *                 enum: [reunion, junta, acuerdo, memorandum, otro]
   *                 description: Tipo de minuta
   *               fecha:
   *                 type: string
   *                 format: date-time
   *                 description: Fecha del evento (ISO 8601)
   *               descripcion:
   *                 type: string
   *                 description: Descripción de la minuta
   *               isActive:
   *                 type: boolean
   *                 description: Estado activo/inactivo
   *     responses:
   *       200:
   *         description: Minuta actualizada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 titulo:
   *                   type: string
   *                 tipo:
   *                   type: string
   *                 fecha:
   *                   type: string
   *                   format: date-time
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
   *       404:
   *         description: Minuta no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   patch:
   *     summary: Actualizar minuta parcial
   *     description: Actualiza parcialmente los metadatos de una minuta (misma funcionalidad que PUT).
   *     tags: [Minutas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la minuta
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               titulo:
   *                 type: string
   *               tipo:
   *                 type: string
   *                 enum: [reunion, junta, acuerdo, memorandum, otro]
   *               fecha:
   *                 type: string
   *                 format: date-time
   *               descripcion:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Minuta actualizada exitosamente
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Minuta no encontrada
   *   delete:
   *     summary: Eliminar minuta
   *     description: Elimina una minuta (baja lógica). El archivo físico también se elimina.
   *     tags: [Minutas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la minuta
   *     responses:
   *       200:
   *         description: Minuta eliminada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Minuta eliminada exitosamente
   *       404:
   *         description: Minuta no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   * /api/minutes/{id}/download:
   *   get:
   *     summary: Obtener URL de descarga/visualización
   *     description: Retorna la URL para descargar o visualizar la minuta. La URL puede ser usada directamente en el navegador o para descargar el archivo.
   *     tags: [Minutas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la minuta
   *     responses:
   *       200:
   *         description: URL de descarga/visualización
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 url:
   *                   type: string
   *                   description: URL completa para acceder a la minuta
   *                   example: http://localhost:4000/uploads/minutes/507f1f77bcf86cd799439011.pdf
   *                 fileName:
   *                   type: string
   *                   description: Nombre del archivo
   *       404:
   *         description: Minuta no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
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
