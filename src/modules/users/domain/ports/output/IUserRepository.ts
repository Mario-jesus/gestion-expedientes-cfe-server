import { User } from '../../entities/User';

/**
 * Interfaz del repositorio de usuarios
 * Define el contrato para persistir y recuperar usuarios
 * 
 * Este es un Output Port (Driven Port) - el dominio define lo que necesita
 */
export interface IUserRepository {
  /**
   * Busca un usuario por su ID
   * @throws UserNotFoundError si el usuario no existe
   */
  findById(id: string): Promise<User | null>;

  /**
   * Busca un usuario por su username
   * @returns User si existe, null si no existe
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Busca un usuario por su email
   * @returns User si existe, null si no existe
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Guarda un usuario (crea o actualiza)
   * @param user - Usuario a guardar
   * @returns El usuario guardado
   */
  save(user: User): Promise<User>;

  /**
   * Crea un nuevo usuario
   * @param user - Usuario a crear
   * @returns El usuario creado
   * @throws DuplicateUserError si el username o email ya existe
   */
  create(user: User): Promise<User>;

  /**
   * Actualiza un usuario existente
   * @param user - Usuario con los cambios
   * @returns El usuario actualizado
   * @throws UserNotFoundError si el usuario no existe
   */
  update(user: User): Promise<User>;

  /**
   * Elimina un usuario (baja lógica - marca como inactivo)
   * @param id - ID del usuario a eliminar
   * @returns true si se eliminó, false si no existía
   */
  delete(id: string): Promise<boolean>;

  /**
   * Busca todos los usuarios con filtros opcionales
   * @param filters - Filtros opcionales (role, isActive, search)
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Lista de usuarios y total
   */
  findAll(filters?: {
    role?: string;
    isActive?: boolean;
    search?: string;
  }, limit?: number, offset?: number): Promise<{ users: User[]; total: number }>;

  /**
   * Verifica si existe un usuario con el username dado
   */
  existsByUsername(username: string): Promise<boolean>;

  /**
   * Verifica si existe un usuario con el email dado
   */
  existsByEmail(email: string): Promise<boolean>;
}
