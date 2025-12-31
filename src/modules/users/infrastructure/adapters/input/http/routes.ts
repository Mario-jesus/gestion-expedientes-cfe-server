import { Router } from 'express';
import { ILogger } from '@shared/domain';
import { authenticate, authorize } from '@shared/infrastructure';
import { ITokenVerifier } from '@shared/infrastructure/http/middleware/types';
import { UserRole } from '@modules/users/domain/enums/UserRole';
import { UserController } from './UserController';
import { allowSelfOrAdmin } from './middleware/allowSelfOrAdmin';

/**
 * Configura las rutas HTTP para el módulo de usuarios
 * 
 * @param controller - Instancia del UserController con casos de uso inyectados
 * @param tokenVerifier - Verificador de tokens (ITokenVerifier) para el middleware de autenticación
 * @param logger - Logger para los middlewares
 * @returns Router configurado con todas las rutas de usuarios
 */
export function createUserRoutes(
  controller: UserController,
  tokenVerifier: ITokenVerifier,
  logger: ILogger
): Router {
  const router = Router();

  // Todas las rutas requieren autenticación
  const authMiddleware = authenticate(tokenVerifier, logger);
  const adminOnly = authorize([UserRole.ADMIN] as string[], logger);
  const allowSelfOrAdminMiddleware = allowSelfOrAdmin(logger);

  /**
   * @swagger
   * /api/users:
   *   post:
   *     summary: Crear nuevo usuario
   *     description: Crea un nuevo usuario en el sistema. Solo administradores pueden crear usuarios.
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - email
   *               - password
   *               - name
   *               - role
   *             properties:
   *               username:
   *                 type: string
   *                 description: Nombre de usuario único
   *                 example: juan.perez
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Correo electrónico único
   *                 example: juan.perez@cfe.mx
   *               password:
   *                 type: string
   *                 format: password
   *                 description: Contraseña del usuario
   *                 example: Password123!
   *               name:
   *                 type: string
   *                 description: Nombre completo del usuario
   *                 example: Juan Pérez
   *               role:
   *                 type: string
   *                 enum: [admin, operator]
   *                 description: Rol del usuario
   *                 example: operator
   *               isActive:
   *                 type: boolean
   *                 description: Estado activo del usuario (por defecto true)
   *                 example: true
   *     responses:
   *       201:
   *         description: Usuario creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 username:
   *                   type: string
   *                 email:
   *                   type: string
   *                 name:
   *                   type: string
   *                 role:
   *                   type: string
   *                 isActive:
   *                   type: boolean
   *                 createdAt:
   *                   type: string
   *                   format: date-time
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
   *         description: Usuario o email ya existe
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // POST /users - Crear usuario (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/', authMiddleware as any, adminOnly as any, controller.create.bind(controller) as any);

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Listar usuarios
   *     description: Lista usuarios con filtros y paginación. Solo administradores pueden listar usuarios.
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: [admin, operator]
   *         description: Filtrar por rol
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo/inactivo
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Búsqueda por nombre, username o email
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Límite de resultados por página
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Offset para paginación
   *     responses:
   *       200:
   *         description: Lista de usuarios
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
   *                       username:
   *                         type: string
   *                       email:
   *                         type: string
   *                       name:
   *                         type: string
   *                       role:
   *                         type: string
   *                       isActive:
   *                         type: boolean
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       403:
   *         description: No autorizado (solo admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // GET /users - Listar usuarios (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/', authMiddleware as any, adminOnly as any, controller.list.bind(controller) as any);

  // IMPORTANTE: Las rutas específicas (sin parámetros) deben ir ANTES de las rutas con parámetros
  // para que Express las capture correctamente

  /**
   * @swagger
   * /api/users/me:
   *   patch:
   *     summary: Actualizar perfil propio
   *     description: Permite a un usuario actualizar su propio perfil (solo nombre y email). No permite cambiar username, role o isActive.
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Nombre completo
   *                 example: Juan Pérez
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Correo electrónico
   *                 example: juan.perez@cfe.mx
   *     responses:
   *       200:
   *         description: Perfil actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 username:
   *                   type: string
   *                 email:
   *                   type: string
   *                 name:
   *                   type: string
   *                 role:
   *                   type: string
   *                 isActive:
   *                   type: boolean
   *       400:
   *         description: Datos inválidos
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
  // PATCH /users/me - Actualizar perfil propio (solo autenticación requerida)
  // Esta ruta debe ir antes de /:id para evitar que "me" sea interpretado como un ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.patch('/me', authMiddleware as any, controller.updateMyProfile.bind(controller) as any);

  /**
   * @swagger
   * /api/users/me/activity:
   *   get:
   *     summary: Obtener historial de actividad propio
   *     description: Retorna el historial de actividad (logs de auditoría) del usuario autenticado con paginación.
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
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
   *         description: Historial de actividad
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
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       401:
   *         description: No autenticado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // GET /users/me/activity - Obtener historial de actividad propio (solo autenticación requerida)
  // Esta ruta debe ir antes de /:id para evitar que "me" sea interpretado como un ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/me/activity', authMiddleware as any, controller.getMyActivity.bind(controller) as any);

  /**
   * @swagger
   * /api/users/{id}/activate:
   *   post:
   *     summary: Activar usuario
   *     description: Activa un usuario desactivado. Solo administradores pueden activar usuarios.
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario
   *     responses:
   *       200:
   *         description: Usuario activado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 username:
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
   *         description: Usuario no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   * /api/users/{id}/deactivate:
   *   post:
   *     summary: Desactivar usuario
   *     description: Desactiva un usuario (baja lógica). Solo administradores pueden desactivar usuarios.
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario
   *     responses:
   *       200:
   *         description: Usuario desactivado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 username:
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
   *         description: Usuario no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   * /api/users/{id}/change-password:
   *   post:
   *     summary: Cambiar contraseña de usuario
   *     description: Permite a un usuario cambiar su propia contraseña o a un administrador cambiar cualquier contraseña.
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 format: password
   *                 description: Contraseña actual (requerida si el usuario cambia su propia contraseña, no requerida para admin)
   *                 example: OldPassword123!
   *               newPassword:
   *                 type: string
   *                 format: password
   *                 description: Nueva contraseña
   *                 example: NewPassword123!
   *     responses:
   *       200:
   *         description: Contraseña actualizada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Contraseña actualizada exitosamente
   *                 id:
   *                   type: string
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: Contraseña actual incorrecta o datos inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: No autorizado (solo puede cambiar su propia contraseña o ser admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Usuario no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // Rutas específicas con parámetros (deben ir antes de las rutas genéricas con parámetros)
  // POST /users/:id/activate - Activar usuario (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/:id/activate', authMiddleware as any, adminOnly as any, controller.activate.bind(controller) as any);

  // POST /users/:id/deactivate - Desactivar usuario (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/:id/deactivate', authMiddleware as any, adminOnly as any, controller.deactivate.bind(controller) as any);

  // POST /users/:id/change-password - Cambiar contraseña (mismo usuario o admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/:id/change-password', authMiddleware as any, allowSelfOrAdminMiddleware as any, controller.changePassword.bind(controller) as any);

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Obtener usuario por ID
   *     description: Obtiene la información de un usuario específico. Los usuarios pueden ver su propio perfil, los administradores pueden ver cualquier perfil.
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario
   *     responses:
   *       200:
   *         description: Información del usuario
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 username:
   *                   type: string
   *                 email:
   *                   type: string
   *                 name:
   *                   type: string
   *                 role:
   *                   type: string
   *                 isActive:
   *                   type: boolean
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *       403:
   *         description: No autorizado (solo puede ver su propio perfil o ser admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Usuario no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   put:
   *     summary: Actualizar usuario completo
   *     description: Actualiza todos los campos de un usuario. Solo administradores pueden actualizar usuarios.
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               name:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [admin, operator]
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Usuario actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 username:
   *                   type: string
   *                 email:
   *                   type: string
   *                 name:
   *                   type: string
   *                 role:
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
   *         description: Usuario no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   patch:
   *     summary: Actualizar usuario parcial
   *     description: Actualiza parcialmente un usuario (misma funcionalidad que PUT). Solo administradores pueden actualizar usuarios.
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               name:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [admin, operator]
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Usuario actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 username:
   *                   type: string
   *                 email:
   *                   type: string
   *                 name:
   *                   type: string
   *                 role:
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
   *         description: Usuario no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *   delete:
   *     summary: Eliminar usuario
   *     description: Elimina un usuario del sistema (baja lógica). Solo administradores pueden eliminar usuarios.
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario
   *     responses:
   *       200:
   *         description: Usuario eliminado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Usuario eliminado exitosamente
   *       403:
   *         description: No autorizado (solo admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Usuario no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // Rutas genéricas con parámetros (deben ir al final)
  // GET /users/:id - Obtener usuario por ID (mismo usuario o admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/:id', authMiddleware as any, allowSelfOrAdminMiddleware as any, controller.getById.bind(controller) as any);

  // PUT /users/:id - Actualizar usuario completo (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.put('/:id', authMiddleware as any, adminOnly as any, controller.update.bind(controller) as any);

  // PATCH /users/:id - Actualizar usuario parcial (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.patch('/:id', authMiddleware as any, adminOnly as any, controller.partialUpdate.bind(controller) as any);

  // DELETE /users/:id - Eliminar usuario (solo admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.delete('/:id', authMiddleware as any, adminOnly as any, controller.delete.bind(controller) as any);

  return router;
}
