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

  /**
   * @swagger
   * /api/collaborators:
   *   post:
   *     summary: Crear colaborador
   *     description: Crea un nuevo colaborador en el sistema. Todos los usuarios autenticados pueden crear colaboradores.
   *     tags: [Colaboradores]
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
   *               - apellidos
   *               - rpe
   *               - areaId
   *               - adscripcionId
   *               - puestoId
   *               - tipoContrato
   *               - rfc
   *               - curp
   *               - imss
   *             properties:
   *               nombre:
   *                 type: string
   *                 description: Nombre del colaborador
   *                 example: Juan
   *               apellidos:
   *                 type: string
   *                 description: Apellidos del colaborador
   *                 example: Pérez García
   *               rpe:
   *                 type: string
   *                 description: Registro de Personal de Empleado (único)
   *                 example: RPE123456
   *               rtt:
   *                 type: string
   *                 description: Registro de Trabajador Temporal (opcional)
   *                 example: RTT789012
   *               areaId:
   *                 type: string
   *                 description: ID del área
   *               adscripcionId:
   *                 type: string
   *                 description: ID de la adscripción
   *               puestoId:
   *                 type: string
   *                 description: ID del puesto
   *               tipoContrato:
   *                 type: string
   *                 enum: [base, confianza, eventual, honorarios, otro]
   *                 description: Tipo de contrato
   *                 example: base
   *               rfc:
   *                 type: string
   *                 description: RFC del colaborador
   *                 example: PEGJ800101ABC
   *               curp:
   *                 type: string
   *                 description: CURP del colaborador
   *                 example: PEGJ800101HDFRRN01
   *               imss:
   *                 type: string
   *                 description: Número de IMSS
   *                 example: 12345678901
   *               isActive:
   *                 type: boolean
   *                 description: Estado activo (por defecto true)
   *                 example: true
   *     responses:
   *       201:
   *         description: Colaborador creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 nombre:
   *                   type: string
   *                 apellidos:
   *                   type: string
   *                 rpe:
   *                   type: string
   *                 rtt:
   *                   type: string
   *                 areaId:
   *                   type: string
   *                 adscripcionId:
   *                   type: string
   *                 puestoId:
   *                   type: string
   *                 tipoContrato:
   *                   type: string
   *                 rfc:
   *                   type: string
   *                 curp:
   *                   type: string
   *                 imss:
   *                   type: string
   *                 isActive:
   *                   type: boolean
   *       400:
   *         description: Datos inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: RPE ya existe
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   get:
   *     summary: Listar colaboradores
   *     description: Lista colaboradores con filtros avanzados y paginación. Todos los usuarios autenticados pueden listar colaboradores.
   *     tags: [Colaboradores]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: areaId
   *         schema:
   *           type: string
   *         description: Filtrar por ID de área
   *       - in: query
   *         name: adscripcionId
   *         schema:
   *           type: string
   *         description: Filtrar por ID de adscripción
   *       - in: query
   *         name: puestoId
   *         schema:
   *           type: string
   *         description: Filtrar por ID de puesto
   *       - in: query
   *         name: tipoContrato
   *         schema:
   *           type: string
   *           enum: [base, confianza, eventual, honorarios, otro]
   *         description: Filtrar por tipo de contrato
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo/inactivo
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Búsqueda por nombre, apellidos o RPE
   *       - in: query
   *         name: estadoExpediente
   *         schema:
   *           type: string
   *           enum: [completo, incompleto, sin_documentos]
   *         description: Filtrar por estado del expediente
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
   *           enum: [nombre, rpe, createdAt]
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
   *         description: Lista de colaboradores
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
   *                       apellidos:
   *                         type: string
   *                       rpe:
   *                         type: string
   *                       areaId:
   *                         type: string
   *                       adscripcionId:
   *                         type: string
   *                       puestoId:
   *                         type: string
   *                       tipoContrato:
   *                         type: string
   *                       isActive:
   *                         type: boolean
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   */
  // POST /collaborators - Crear colaborador
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/', authMiddleware as any, controller.create.bind(controller) as any);

  // GET /collaborators - Listar colaboradores
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/', authMiddleware as any, controller.list.bind(controller) as any);

  /**
   * @swagger
   * /api/collaborators/{id}:
   *   get:
   *     summary: Obtener colaborador por ID
   *     description: Obtiene la información completa de un colaborador específico.
   *     tags: [Colaboradores]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del colaborador
   *     responses:
   *       200:
   *         description: Información del colaborador
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 nombre:
   *                   type: string
   *                 apellidos:
   *                   type: string
   *                 rpe:
   *                   type: string
   *                 rtt:
   *                   type: string
   *                 areaId:
   *                   type: string
   *                 adscripcionId:
   *                   type: string
   *                 puestoId:
   *                   type: string
   *                 tipoContrato:
   *                   type: string
   *                 rfc:
   *                   type: string
   *                 curp:
   *                   type: string
   *                 imss:
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
   *         description: Colaborador no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   put:
   *     summary: Actualizar colaborador completo
   *     description: Actualiza todos los campos de un colaborador. Todos los usuarios autenticados pueden actualizar colaboradores.
   *     tags: [Colaboradores]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del colaborador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nombre:
   *                 type: string
   *               apellidos:
   *                 type: string
   *               rtt:
   *                 type: string
   *               areaId:
   *                 type: string
   *               adscripcionId:
   *                 type: string
   *               puestoId:
   *                 type: string
   *               tipoContrato:
   *                 type: string
   *                 enum: [base, confianza, eventual, honorarios, otro]
   *               rfc:
   *                 type: string
   *               curp:
   *                 type: string
   *               imss:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Colaborador actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 nombre:
   *                   type: string
   *                 apellidos:
   *                   type: string
   *                 rpe:
   *                   type: string
   *                 tipoContrato:
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
   *         description: Colaborador no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   patch:
   *     summary: Actualizar colaborador parcial
   *     description: Actualiza parcialmente un colaborador (misma funcionalidad que PUT).
   *     tags: [Colaboradores]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del colaborador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nombre:
   *                 type: string
   *               apellidos:
   *                 type: string
   *               rtt:
   *                 type: string
   *               areaId:
   *                 type: string
   *               adscripcionId:
   *                 type: string
   *               puestoId:
   *                 type: string
   *               tipoContrato:
   *                 type: string
   *                 enum: [base, confianza, eventual, honorarios, otro]
   *               rfc:
   *                 type: string
   *               curp:
   *                 type: string
   *               imss:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Colaborador actualizado exitosamente
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Colaborador no encontrado
   *   delete:
   *     summary: Eliminar colaborador
   *     description: Elimina un colaborador (baja lógica). Todos los usuarios autenticados pueden eliminar colaboradores.
   *     tags: [Colaboradores]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del colaborador
   *     responses:
   *       200:
   *         description: Colaborador eliminado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Colaborador eliminado exitosamente
   *       404:
   *         description: Colaborador no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // GET /collaborators/:id - Obtener colaborador por ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/:id', authMiddleware as any, controller.getById.bind(controller) as any);

  /**
   * @swagger
   * /api/collaborators/{id}/documents:
   *   get:
   *     summary: Obtener documentos de un colaborador
   *     description: Retorna todos los documentos asociados a un colaborador específico, con filtros opcionales
   *     tags: [Colaboradores]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del colaborador
   *       - in: query
   *         name: kind
   *         schema:
   *           type: string
   *           enum: [bateria, historial, perfil, constancia, otro]
   *         description: Filtrar por tipo de documento
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo/inactivo
   *     responses:
   *       200:
   *         description: Lista de documentos del colaborador
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
   *                       isActive:
   *                         type: boolean
   *                 total:
   *                   type: number
   *       404:
   *         description: Colaborador no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: No autenticado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // GET /collaborators/:id/documents - Obtener documentos del colaborador
  // IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros genéricos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get(
    '/:id/documents',
    authMiddleware as any,
    controller.getDocuments.bind(controller) as any
  );

  /**
   * @swagger
   * /api/collaborators/{id}/activate:
   *   post:
   *     summary: Activar colaborador
   *     description: Activa un colaborador desactivado. Todos los usuarios autenticados pueden activar colaboradores.
   *     tags: [Colaboradores]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del colaborador
   *     responses:
   *       200:
   *         description: Colaborador activado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 rpe:
   *                   type: string
   *                 nombreCompleto:
   *                   type: string
   *                 isActive:
   *                   type: boolean
   *                   example: true
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: Colaborador no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   * /api/collaborators/{id}/deactivate:
   *   post:
   *     summary: Desactivar colaborador
   *     description: Desactiva un colaborador (baja lógica). Todos los usuarios autenticados pueden desactivar colaboradores.
   *     tags: [Colaboradores]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del colaborador
   *     responses:
   *       200:
   *         description: Colaborador desactivado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 rpe:
   *                   type: string
   *                 nombreCompleto:
   *                   type: string
   *                 isActive:
   *                   type: boolean
   *                   example: false
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: Colaborador no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
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
