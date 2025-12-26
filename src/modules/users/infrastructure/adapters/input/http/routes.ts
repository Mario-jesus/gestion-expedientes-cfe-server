import { Router } from 'express';
import { UserController } from './UserController';

/**
 * Configura las rutas HTTP para el módulo de usuarios
 * 
 * @param controller - Instancia del UserController con casos de uso inyectados
 * @returns Router configurado con todas las rutas de usuarios
 */
export function createUserRoutes(controller: UserController): Router {
  const router = Router();

  // POST /users - Crear usuario
  router.post('/', controller.create.bind(controller));

  // GET /users - Listar usuarios (con filtros y paginación)
  router.get('/', controller.list.bind(controller));

  // GET /users/:id - Obtener usuario por ID
  router.get('/:id', controller.getById.bind(controller));

  // PUT /users/:id - Actualizar usuario (completo)
  router.put('/:id', controller.update.bind(controller));

  // PATCH /users/:id - Actualizar usuario (parcial)
  router.patch('/:id', controller.partialUpdate.bind(controller));

  // DELETE /users/:id - Eliminar usuario
  router.delete('/:id', controller.delete.bind(controller));

  // POST /users/:id/activate - Activar usuario
  router.post('/:id/activate', controller.activate.bind(controller));

  // POST /users/:id/deactivate - Desactivar usuario
  router.post('/:id/deactivate', controller.deactivate.bind(controller));

  // POST /users/:id/change-password - Cambiar contraseña
  router.post('/:id/change-password', controller.changePassword.bind(controller));

  return router;
}
