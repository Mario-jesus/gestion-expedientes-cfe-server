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

  /**
   * @swagger
   * /api/audit:
   *   get:
   *     summary: Listar logs de auditoría
   *     description: Lista logs de auditoría con filtros avanzados y paginación. Todos los usuarios autenticados pueden consultar logs de auditoría.
   *     tags: [Auditoría]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *         description: Filtrar por ID de usuario que realizó la acción
   *       - in: query
   *         name: action
   *         schema:
   *           type: string
   *           enum: [create, update, delete, upload, download, view, activate, deactivate, login, logout, refresh_token, change_password]
   *         description: Filtrar por tipo de acción
   *         example: create
   *       - in: query
   *         name: entity
   *         schema:
   *           type: string
   *           enum: [user, collaborator, document, minute, area, adscripcion, puesto, documentType]
   *         description: Filtrar por tipo de entidad
   *         example: document
   *       - in: query
   *         name: entityId
   *         schema:
   *           type: string
   *         description: Filtrar por ID de entidad específica
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
   *           enum: [createdAt, action, entity]
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
   *         description: Lista de logs de auditoría
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
   *                       userId:
   *                         type: string
   *                       action:
   *                         type: string
   *                       entity:
   *                         type: string
   *                       entityId:
   *                         type: string
   *                       metadata:
   *                         type: object
   *                         description: Información adicional del evento
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       400:
   *         description: Parámetros inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // GET /audit - Listar logs con filtros
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/', authMiddleware as any, controller.list.bind(controller) as any);

  /**
   * @swagger
   * /api/audit/entity/{entity}/{entityId}:
   *   get:
   *     summary: Obtener logs de una entidad específica
   *     description: Retorna todos los logs de auditoría relacionados con una entidad específica (ej. historial completo de un documento, colaborador, etc.).
   *     tags: [Auditoría]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: entity
   *         required: true
   *         schema:
   *           type: string
   *           enum: [user, collaborator, document, minute, area, adscripcion, puesto, documentType]
   *         description: Tipo de entidad
   *         example: document
   *       - in: path
   *         name: entityId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la entidad
   *         example: 507f1f77bcf86cd799439011
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
   *         description: Lista de logs de la entidad
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
   *                       userId:
   *                         type: string
   *                       action:
   *                         type: string
   *                       entity:
   *                         type: string
   *                       entityId:
   *                         type: string
   *                       metadata:
   *                         type: object
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       400:
   *         description: Tipo de entidad inválido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // GET /audit/entity/:entity/:entityId - Obtener logs de una entidad específica
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get(
    '/entity/:entity/:entityId',
    authMiddleware as any,
    controller.getByEntity.bind(controller) as any
  );

  /**
   * @swagger
   * /api/audit/user/{userId}:
   *   get:
   *     summary: Obtener logs de un usuario específico
   *     description: Retorna todos los logs de auditoría de acciones realizadas por un usuario específico.
   *     tags: [Auditoría]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario
   *         example: 507f1f77bcf86cd799439011
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
   *         description: Lista de logs del usuario
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
   *                       userId:
   *                         type: string
   *                       action:
   *                         type: string
   *                       entity:
   *                         type: string
   *                       entityId:
   *                         type: string
   *                       metadata:
   *                         type: object
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   */
  // GET /audit/user/:userId - Obtener logs de un usuario específico
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get(
    '/user/:userId',
    authMiddleware as any,
    controller.getByUserId.bind(controller) as any
  );

  /**
   * @swagger
   * /api/audit/{id}:
   *   get:
   *     summary: Obtener log por ID
   *     description: Obtiene un log de auditoría específico por su ID. Los logs son inmutables y solo se pueden leer.
   *     tags: [Auditoría]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del log de auditoría
   *     responses:
   *       200:
   *         description: Información del log de auditoría
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 userId:
   *                   type: string
   *                   description: ID del usuario que realizó la acción
   *                 action:
   *                   type: string
   *                   enum: [create, update, delete, upload, download, view, activate, deactivate, login, logout, refresh_token, change_password]
   *                   description: Tipo de acción realizada
   *                 entity:
   *                   type: string
   *                   enum: [user, collaborator, document, minute, area, adscripcion, puesto, documentType]
   *                   description: Tipo de entidad afectada
   *                 entityId:
   *                   type: string
   *                   description: ID de la entidad afectada
   *                 metadata:
   *                   type: object
   *                   description: Información adicional del evento (estructura variable según el tipo de acción)
   *                   additionalProperties: true
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                   description: Fecha y hora en que se registró el log
   *       404:
   *         description: Log no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // GET /audit/:id - Obtener log por ID (debe ir al final para no interferir con rutas específicas)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/:id', authMiddleware as any, controller.getById.bind(controller) as any);

  return router;
}
