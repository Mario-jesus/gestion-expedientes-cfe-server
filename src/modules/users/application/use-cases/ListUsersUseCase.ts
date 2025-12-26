import { ILogger } from '@shared/domain';
import { User } from '../../domain';
import { ForbiddenError } from '../../domain/exceptions/ForbiddenError';
import { IUserRepository } from '../../domain/ports/output/IUserRepository';
import { IListUsersUseCase } from '../ports/input/IListUsersUseCase';
import { ListUsersDTO } from '../dto/ListUsersDTO';

/**
 * Caso de uso para listar usuarios con filtros y paginación
 * 
 * Se encarga de:
 * - Validar permisos (solo administradores pueden listar usuarios)
 * - Aplicar filtros opcionales (role, isActive, search)
 * - Aplicar paginación (limit, offset)
 * - Retornar lista de usuarios y total de resultados
 */
export class ListUsersUseCase implements IListUsersUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con filtros y parámetros de paginación
   * @param performedBy - ID del usuario que realiza la acción (para autorización)
   * @returns Lista de usuarios y total de resultados
   * @throws ForbiddenError si el usuario no tiene permisos para listar usuarios
   */
  async execute(dto: ListUsersDTO, performedBy?: string): Promise<{ users: User[]; total: number }> {
    this.logger.info('Ejecutando caso de uso: Listar usuarios', {
      filters: dto.filters,
      limit: dto.limit,
      offset: dto.offset,
      performedBy,
    });

    // Validar permisos: solo administradores pueden listar usuarios
    if (performedBy) {
      const performer = await this.userRepository.findById(performedBy);
      if (!performer) {
        this.logger.warn('Intento de listar usuarios por usuario inexistente', {
          performedBy,
        });
        throw new ForbiddenError('Usuario no encontrado');
      }

      if (!performer.isAdmin()) {
        this.logger.warn('Intento de listar usuarios sin permisos', {
          performedBy,
          reason: 'Solo administradores pueden listar usuarios',
        });
        throw new ForbiddenError('Solo los administradores pueden listar usuarios');
      }
    }

    // Preparar filtros para el repositorio
    const filters = dto.filters ? {
      ...(dto.filters.role && { role: dto.filters.role as string }),
      ...(dto.filters.isActive !== undefined && { isActive: dto.filters.isActive }),
      ...(dto.filters.search && { search: dto.filters.search }),
    } : undefined;

    // Aplicar valores por defecto para paginación
    const limit = dto.limit ?? 10;
    const offset = dto.offset ?? 0;

    // Validar valores de paginación
    if (limit < 1 || limit > 100) {
      throw new Error('El límite debe estar entre 1 y 100');
    }
    if (offset < 0) {
      throw new Error('El offset no puede ser negativo');
    }

    // Obtener usuarios del repositorio
    const result = await this.userRepository.findAll(filters, limit, offset);

    this.logger.info('Usuarios listados exitosamente', {
      total: result.total,
      returned: result.users.length,
      limit,
      offset,
      performedBy,
    });

    return result;
  }
}
