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

  /**
   * @swagger
   * /api/documents:
   *   post:
   *     summary: Crear/subir documento
   *     description: Crea un nuevo documento con upload de archivo. El archivo se envía como multipart/form-data.
   *     tags: [Documentos]
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
   *               - collaboratorId
   *               - kind
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: Archivo a subir (PDF, DOC, DOCX, XLS, XLSX, imágenes)
   *               collaboratorId:
   *                 type: string
   *                 description: ID del colaborador al que pertenece el documento
   *                 example: 507f1f77bcf86cd799439011
   *               kind:
   *                 type: string
   *                 enum: [bateria, historial, perfil, constancia, c0_03, otro]
   *                 description: Tipo principal del documento
   *                 example: bateria
   *               periodo:
   *                 type: string
   *                 description: Período del documento (opcional, para algunos tipos)
   *                 example: 2023-2024
   *               descripcion:
   *                 type: string
   *                 description: Descripción adicional del documento (opcional)
   *               documentTypeId:
   *                 type: string
   *                 description: ID del tipo de documento específico (opcional, solo para kind 'cchl')
   *     responses:
   *       201:
   *         description: Documento creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 collaboratorId:
   *                   type: string
   *                 kind:
   *                   type: string
   *                 fileName:
   *                   type: string
   *                 fileUrl:
   *                   type: string
   *                 fileSize:
   *                   type: number
   *                 fileType:
   *                   type: string
   *                 periodo:
   *                   type: string
   *                 descripcion:
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
   *       404:
   *         description: Colaborador no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   get:
   *     summary: Listar documentos
   *     description: Lista documentos con filtros y paginación. Todos los usuarios autenticados pueden listar documentos.
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: collaboratorId
   *         schema:
   *           type: string
   *         description: Filtrar por ID de colaborador
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
   *         name: documentTypeId
   *         schema:
   *           type: string
   *         description: Filtrar por ID de tipo de documento
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
   *           enum: [createdAt, uploadedAt, fileName]
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
   *         description: Lista de documentos
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
   *                       collaboratorId:
   *                         type: string
   *                       kind:
   *                         type: string
   *                       fileName:
   *                         type: string
   *                       fileUrl:
   *                         type: string
   *                       fileSize:
   *                         type: number
   *                       fileType:
   *                         type: string
   *                       periodo:
   *                         type: string
   *                       descripcion:
   *                         type: string
   *                       isActive:
   *                         type: boolean
   *                       uploadedAt:
   *                         type: string
   *                         format: date-time
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   */
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

  /**
   * @swagger
   * /api/documents/{id}:
   *   get:
   *     summary: Obtener documento por ID
   *     description: Obtiene la información de un documento específico.
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del documento
   *     responses:
   *       200:
   *         description: Información del documento
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 collaboratorId:
   *                   type: string
   *                 kind:
   *                   type: string
   *                 fileName:
   *                   type: string
   *                 fileUrl:
   *                   type: string
   *                 fileSize:
   *                   type: number
   *                 fileType:
   *                   type: string
   *                 periodo:
   *                   type: string
   *                 descripcion:
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
   *         description: Documento no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   put:
   *     summary: Actualizar documento completo
   *     description: Actualiza los metadatos de un documento. No se puede cambiar el archivo, solo metadatos (periodo, descripcion, documentTypeId, isActive).
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del documento
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               periodo:
   *                 type: string
   *                 description: Período del documento
   *               descripcion:
   *                 type: string
   *                 description: Descripción del documento
   *               documentTypeId:
   *                 type: string
   *                 description: ID del tipo de documento (solo para kind 'cchl')
   *               isActive:
   *                 type: boolean
   *                 description: Estado activo/inactivo
   *     responses:
   *       200:
   *         description: Documento actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 collaboratorId:
   *                   type: string
   *                 kind:
   *                   type: string
   *                 fileName:
   *                   type: string
   *                 periodo:
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
   *       404:
   *         description: Documento no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   patch:
   *     summary: Actualizar documento parcial
   *     description: Actualiza parcialmente los metadatos de un documento (misma funcionalidad que PUT).
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del documento
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               periodo:
   *                 type: string
   *               descripcion:
   *                 type: string
   *               documentTypeId:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Documento actualizado exitosamente
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Documento no encontrado
   *   delete:
   *     summary: Eliminar documento
   *     description: Elimina un documento (baja lógica). El archivo físico también se elimina.
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del documento
   *     responses:
   *       200:
   *         description: Documento eliminado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Documento eliminado exitosamente
   *       404:
   *         description: Documento no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   * /api/documents/{id}/download:
   *   get:
   *     summary: Obtener URL de descarga/visualización
   *     description: Retorna la URL para descargar o visualizar el documento. La URL puede ser usada directamente en el navegador o para descargar el archivo.
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del documento
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
   *                   description: URL completa para acceder al documento
   *                   example: http://localhost:4000/uploads/documents/507f1f77bcf86cd799439011.pdf
   *                 fileName:
   *                   type: string
   *                   description: Nombre del archivo
   *       404:
   *         description: Documento no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
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
