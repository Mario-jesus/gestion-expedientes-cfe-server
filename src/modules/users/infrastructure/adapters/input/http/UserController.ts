import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@shared/domain';
import { AuthenticatedRequest } from '@shared/infrastructure';
import { ICreateUserUseCase } from '@modules/users/application/ports/input/ICreateUserUseCase';
import { IGetUserByIdUseCase } from '@modules/users/application/ports/input/IGetUserByIdUseCase';
import { IListUsersUseCase } from '@modules/users/application/ports/input/IListUsersUseCase';
import { IUpdateUserUseCase } from '@modules/users/application/ports/input/IUpdateUserUseCase';
import { IUpdateMyProfileUseCase } from '@modules/users/application/ports/input/IUpdateMyProfileUseCase';
import { IDeleteUserUseCase } from '@modules/users/application/ports/input/IDeleteUserUseCase';
import { IActivateUserUseCase } from '@modules/users/application/ports/input/IActivateUserUseCase';
import { IDeactivateUserUseCase } from '@modules/users/application/ports/input/IDeactivateUserUseCase';
import { IChangeUserPasswordUseCase } from '@modules/users/application/ports/input/IChangeUserPasswordUseCase';
import { IGetLogEntriesByUserIdUseCase } from '@modules/audit/application/ports/input/IGetLogEntriesByUserIdUseCase';
import { CreateUserDTO } from '@modules/users/application/dto/CreateUserDTO';
import { UpdateUserDTO } from '@modules/users/application/dto/UpdateUserDTO';
import { UpdateProfileDTO } from '@modules/users/application/dto/UpdateProfileDTO';
import { ListUsersDTO } from '@modules/users/application/dto/ListUsersDTO';
import { ChangePasswordDTO } from '@modules/users/application/dto/ChangePasswordDTO';
import { UserRole } from '@modules/users/domain/enums/UserRole';

/**
 * Controller HTTP para la gestión de usuarios
 * 
 * Este controller actúa como adaptador de entrada (Input Adapter) que convierte
 * requests HTTP en llamadas a casos de uso de la capa de aplicación.
 * 
 * Responsabilidades:
 * - Recibir requests HTTP
 * - Validar y mapear datos del request a DTOs
 * - Llamar a los casos de uso correspondientes
 * - Formatear respuestas HTTP
 * - Manejar errores (delegados al errorHandler de Express)
 */
export class UserController {
  constructor(
    private readonly createUserUseCase: ICreateUserUseCase,
    private readonly getUserByIdUseCase: IGetUserByIdUseCase,
    private readonly listUsersUseCase: IListUsersUseCase,
    private readonly updateUserUseCase: IUpdateUserUseCase,
    private readonly updateMyProfileUseCase: IUpdateMyProfileUseCase,
    private readonly deleteUserUseCase: IDeleteUserUseCase,
    private readonly activateUserUseCase: IActivateUserUseCase,
    private readonly deactivateUserUseCase: IDeactivateUserUseCase,
    private readonly changeUserPasswordUseCase: IChangeUserPasswordUseCase,
    private readonly getLogEntriesByUserIdUseCase: IGetLogEntriesByUserIdUseCase,
    private readonly logger: ILogger
  ) {}

  /**
   * Obtiene el ID del usuario autenticado desde el request
   * El request debe ser AuthenticatedRequest (después del middleware authenticate)
   */
  private getCurrentUserId(req: Request | AuthenticatedRequest): string | undefined {
    if ('user' in req && req.user) {
      return req.user.id;
    }
    return undefined;
  }

  /**
   * POST /users
   * Crea un nuevo usuario
   * Requiere autenticación y rol de administrador
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateUserDTO = req.body;
      const createdBy = this.getCurrentUserId(req);

      this.logger.info('Creando usuario', {
        username: dto.username,
        email: dto.email,
        role: dto.role,
        createdBy,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      const user = await this.createUserUseCase.execute(dto, createdBy);

      this.logger.info('Usuario creado exitosamente', {
        userId: user.id,
        username: user.usernameValue,
      });

      res.status(201).json(user.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/:id
   * Obtiene un usuario por su ID
   * Requiere autenticación
   * Permite al mismo usuario ver su propio perfil o a un administrador ver cualquier perfil
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      const user = performedBy 
        ? await this.getUserByIdUseCase.execute(id, performedBy)
        : await this.getUserByIdUseCase.execute(id);

      res.status(200).json(user.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users
   * Lista usuarios con filtros y paginación
   * Requiere autenticación y rol de administrador
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validar y convertir role a UserRole si está presente
      let role: UserRole | undefined;
      if (req.query.role) {
        const roleStr = req.query.role as string;
        if (Object.values(UserRole).includes(roleStr as UserRole)) {
          role = roleStr as UserRole;
        }
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const filters: ListUsersDTO['filters'] = {};
      if (role) filters.role = role;
      // Por defecto, solo mostrar usuarios activos
      // Si se especifica isActive explícitamente, usar ese valor
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      } else {
        // Por defecto, solo activos
        filters.isActive = true;
      }
      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const dto: ListUsersDTO = {
        ...(Object.keys(filters).length > 0 && { filters }),
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
      };

      const performedBy = this.getCurrentUserId(req);

      const result = performedBy
        ? await this.listUsersUseCase.execute(dto, performedBy)
        : await this.listUsersUseCase.execute(dto);

      res.status(200).json({
        data: result.users.map(user => user.toPublicJSON()),
        pagination: {
          total: result.total,
          limit: dto.limit ?? 10,
          offset: dto.offset ?? 0,
          totalPages: Math.ceil(result.total / (dto.limit ?? 10)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /users/:id
   * Actualiza un usuario (actualización completa)
   * Requiere autenticación y rol de administrador
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const dto: UpdateUserDTO = req.body;
      const performedBy = this.getCurrentUserId(req);

      const user = performedBy
        ? await this.updateUserUseCase.execute(id, dto, performedBy)
        : await this.updateUserUseCase.execute(id, dto);

      res.status(200).json(user.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /users/:id
   * Actualiza parcialmente un usuario (misma lógica que PUT)
   * Requiere autenticación y rol de administrador
   */
  async partialUpdate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const dto: UpdateUserDTO = req.body;
      const performedBy = this.getCurrentUserId(req);

      const user = performedBy
        ? await this.updateUserUseCase.execute(id, dto, performedBy)
        : await this.updateUserUseCase.execute(id, dto);

      res.status(200).json(user.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /users/:id
   * Elimina un usuario
   * Requiere autenticación y rol de administrador
   */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      this.logger.info('Eliminando usuario', {
        targetUserId: id,
        performedBy,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      if (performedBy) {
        await this.deleteUserUseCase.execute(id, performedBy);
      } else {
        await this.deleteUserUseCase.execute(id);
      }

      this.logger.info('Usuario eliminado exitosamente', {
        targetUserId: id,
        performedBy,
      });

      res.status(200).json({
        message: 'Usuario eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /users/:id/activate
   * Activa un usuario
   * Requiere autenticación y rol de administrador
   */
  async activate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      const user = performedBy
        ? await this.activateUserUseCase.execute(id, performedBy)
        : await this.activateUserUseCase.execute(id);

      res.status(200).json({
        id: user.id,
        username: user.usernameValue,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /users/:id/deactivate
   * Desactiva un usuario
   * Requiere autenticación y rol de administrador
   */
  async deactivate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      const user = performedBy
        ? await this.deactivateUserUseCase.execute(id, performedBy)
        : await this.deactivateUserUseCase.execute(id);

      res.status(200).json({
        id: user.id,
        username: user.usernameValue,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /users/:id/change-password
   * Cambia la contraseña de un usuario
   * Requiere autenticación
   * Permite al mismo usuario cambiar su propia contraseña o a un administrador cambiar cualquier contraseña
   */
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const dto: ChangePasswordDTO = req.body;
      const performedBy = this.getCurrentUserId(req);

      this.logger.info('Cambiando contraseña de usuario', {
        targetUserId: id,
        performedBy,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      const user = performedBy
        ? await this.changeUserPasswordUseCase.execute(id, dto, performedBy)
        : await this.changeUserPasswordUseCase.execute(id, dto);

      this.logger.info('Contraseña de usuario cambiada exitosamente', {
        targetUserId: id,
        performedBy,
      });

      res.status(200).json({
        message: 'Contraseña actualizada exitosamente',
        id: user.id,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /users/me
   * Actualiza el perfil propio del usuario autenticado
   * Requiere autenticación
   * Solo permite actualizar nombre y email (no username, role, isActive)
   */
  async updateMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getCurrentUserId(req);
      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      // Filtrar solo los campos permitidos (name y email)
      // Esto previene que campos no permitidos como role, isActive, username sean procesados
      const dto: UpdateProfileDTO = {
        ...(req.body.name !== undefined && { name: req.body.name }),
        ...(req.body.email !== undefined && { email: req.body.email }),
      };

      this.logger.info('Actualizando perfil propio', {
        userId,
        fieldsToUpdate: {
          email: dto.email !== undefined,
          name: dto.name !== undefined,
        },
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      const user = await this.updateMyProfileUseCase.execute(userId, dto);

      this.logger.info('Perfil actualizado exitosamente', {
        userId,
      });

      res.status(200).json(user.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/me/activity
   * Obtiene el historial de actividad del usuario autenticado
   * Requiere autenticación
   */
  async getMyActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getCurrentUserId(req);
      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      this.logger.debug('Obteniendo historial de actividad del usuario', {
        userId,
        limit,
        offset,
      });

      const result = await this.getLogEntriesByUserIdUseCase.execute(userId, limit, offset);

      res.status(200).json({
        data: result.logs.map((log) => log.toPublicJSON()),
        pagination: {
          total: result.total,
          limit,
          offset,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
