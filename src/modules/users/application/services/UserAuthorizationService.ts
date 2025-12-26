import { ILogger } from '@shared/domain';
import { User } from '../../domain/entities/User';
import { ForbiddenError } from '../../domain/exceptions/ForbiddenError';
import { IUserRepository } from '../../domain/ports/output/IUserRepository';

/**
 * Servicio de autorización para operaciones de usuarios
 * 
 * Combina la lógica genérica de verificación de roles con la lógica específica
 * de negocio para determinar si un usuario puede realizar acciones relacionadas
 * con la gestión de usuarios
 */
export class UserAuthorizationService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Verifica si un usuario es administrador
   */
  private isAdmin(user: User): boolean {
    return user.isAdmin();
  }


  /**
   * Verifica si un usuario puede actualizar otro usuario
   * Reglas:
   * - Un usuario puede actualizar su propio perfil (solo nombre y email)
   * - Un administrador puede actualizar cualquier usuario
   */
  async canUpdateUser(performerId: string, targetUserId: string): Promise<boolean> {
    // Si es el mismo usuario, puede actualizar su propio perfil
    if (performerId === targetUserId) {
      return true;
    }

    // Obtener el usuario que realiza la acción
    const performer = await this.userRepository.findById(performerId);
    if (!performer) {
      return false;
    }

    // Solo los administradores pueden actualizar otros usuarios
    return this.isAdmin(performer);
  }

  /**
   * Verifica si un usuario puede crear otros usuarios
   * Regla: Solo administradores pueden crear usuarios
   */
  async canCreateUser(performerId: string): Promise<boolean> {
    const performer = await this.userRepository.findById(performerId);
    if (!performer) {
      return false;
    }
    return this.isAdmin(performer);
  }

  /**
   * Verifica si un usuario puede activar/desactivar otro usuario
   * Reglas:
   * - Un administrador puede activar/desactivar cualquier usuario
   * - Un usuario NO puede desactivarse a sí mismo
   */
  async canActivateDeactivateUser(performerId: string, targetUserId: string): Promise<boolean> {
    // No se puede desactivar a sí mismo
    if (performerId === targetUserId) {
      return false;
    }

    const performer = await this.userRepository.findById(performerId);
    if (!performer) {
      return false;
    }

    // Solo los administradores pueden activar/desactivar usuarios
    return this.isAdmin(performer);
  }

  /**
   * Verifica si un usuario puede cambiar la contraseña de otro usuario
   * Reglas:
   * - Un usuario puede cambiar su propia contraseña
   * - Un administrador puede cambiar la contraseña de cualquier usuario
   */
  async canChangePassword(performerId: string, targetUserId: string): Promise<boolean> {
    // Si es el mismo usuario, puede cambiar su propia contraseña
    if (performerId === targetUserId) {
      return true;
    }

    const performer = await this.userRepository.findById(performerId);
    if (!performer) {
      return false;
    }

    // Solo los administradores pueden cambiar la contraseña de otros usuarios
    return this.isAdmin(performer);
  }

  /**
   * Verifica si un usuario puede ver otro usuario
   * Reglas:
   * - Un usuario puede ver su propio perfil
   * - Un administrador puede ver cualquier usuario
   */
  async canViewUser(performerId: string, targetUserId: string): Promise<boolean> {
    // Si es el mismo usuario, puede ver su propio perfil
    if (performerId === targetUserId) {
      return true;
    }

    const performer = await this.userRepository.findById(performerId);
    if (!performer) {
      return false;
    }

    // Solo los administradores pueden ver otros usuarios
    return this.isAdmin(performer);
  }

  /**
   * Verifica si un usuario puede eliminar otro usuario
   * Reglas:
   * - Un administrador puede eliminar cualquier usuario
   * - Un usuario NO puede eliminarse a sí mismo
   */
  async canDeleteUser(performerId: string, targetUserId: string): Promise<boolean> {
    // No se puede eliminar a sí mismo
    if (performerId === targetUserId) {
      return false;
    }

    const performer = await this.userRepository.findById(performerId);
    if (!performer) {
      return false;
    }

    // Solo los administradores pueden eliminar usuarios
    return this.isAdmin(performer);
  }

  /**
   * Lanza error si el usuario no puede actualizar otro usuario
   * @throws ForbiddenError si no tiene permisos
   */
  async requireCanUpdateUser(performerId: string, targetUserId: string): Promise<void> {
    const canUpdate = await this.canUpdateUser(performerId, targetUserId);
    if (!canUpdate) {
      if (performerId === targetUserId) {
        throw new ForbiddenError('No puedes actualizar este perfil con estos datos');
      }
      throw new ForbiddenError('Solo los administradores pueden actualizar otros usuarios');
    }
  }

  /**
   * Lanza error si el usuario no puede crear usuarios
   * @throws ForbiddenError si no tiene permisos
   */
  async requireCanCreateUser(performerId: string): Promise<void> {
    const canCreate = await this.canCreateUser(performerId);
    if (!canCreate) {
      this.logger.warn('Intento de crear usuario sin permisos', {
        performerId,
        reason: 'Solo administradores pueden crear usuarios',
      });
      throw new ForbiddenError('Solo los administradores pueden crear usuarios');
    }
  }

  /**
   * Lanza error si el usuario no puede activar/desactivar otro usuario
   * @throws ForbiddenError si no tiene permisos
   */
  async requireCanActivateDeactivateUser(performerId: string, targetUserId: string): Promise<void> {
    if (performerId === targetUserId) {
      this.logger.warn('Intento de activar/desactivar usuario sin permisos', {
        performerId,
        targetUserId,
        reason: 'Usuario intentó desactivarse a sí mismo',
      });
      throw new ForbiddenError('No puedes desactivarte a ti mismo');
    }

    const canActivateDeactivate = await this.canActivateDeactivateUser(performerId, targetUserId);
    if (!canActivateDeactivate) {
      this.logger.warn('Intento de activar/desactivar usuario sin permisos', {
        performerId,
        targetUserId,
        reason: 'Solo administradores pueden activar/desactivar usuarios',
      });
      throw new ForbiddenError('Solo los administradores pueden activar/desactivar usuarios');
    }
  }

  /**
   * Lanza error si el usuario no puede cambiar la contraseña de otro usuario
   * @throws ForbiddenError si no tiene permisos
   */
  async requireCanChangePassword(performerId: string, targetUserId: string): Promise<void> {
    const canChange = await this.canChangePassword(performerId, targetUserId);
    if (!canChange) {
      this.logger.warn('Intento de cambiar contraseña sin permisos', {
        performerId,
        targetUserId,
        reason: 'Solo administradores pueden cambiar la contraseña de otros usuarios',
      });
      throw new ForbiddenError('Solo los administradores pueden cambiar la contraseña de otros usuarios');
    }
  }

  /**
   * Lanza error si el usuario no puede eliminar otro usuario
   * @throws ForbiddenError si no tiene permisos
   */
  async requireCanDeleteUser(performerId: string, targetUserId: string): Promise<void> {
    if (performerId === targetUserId) {
      this.logger.warn('Intento de eliminar usuario sin permisos', {
        performerId,
        targetUserId,
        reason: 'Usuario intentó eliminarse a sí mismo',
      });
      throw new ForbiddenError('No puedes eliminarte a ti mismo');
    }

    const canDelete = await this.canDeleteUser(performerId, targetUserId);
    if (!canDelete) {
      this.logger.warn('Intento de eliminar usuario sin permisos', {
        performerId,
        targetUserId,
        reason: 'Solo administradores pueden eliminar usuarios',
      });
      throw new ForbiddenError('Solo los administradores pueden eliminar usuarios');
    }
  }
}
