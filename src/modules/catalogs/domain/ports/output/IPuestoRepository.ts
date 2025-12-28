import { Puesto } from '../../entities/Puesto';

/**
 * Interfaz del repositorio de puestos
 * Define el contrato para persistir y recuperar puestos
 * 
 * Este es un Output Port (Driven Port) - el dominio define lo que necesita
 */
export interface IPuestoRepository {
  /**
   * Busca un puesto por su ID
   * @returns Puesto si existe, null si no existe
   */
  findById(id: string): Promise<Puesto | null>;

  /**
   * Busca un puesto por su nombre
   * @returns Puesto si existe, null si no existe
   */
  findByNombre(nombre: string): Promise<Puesto | null>;

  /**
   * Guarda un puesto (crea o actualiza)
   * @param puesto - Puesto a guardar
   * @returns El puesto guardado
   */
  save(puesto: Puesto): Promise<Puesto>;

  /**
   * Crea un nuevo puesto
   * @param puesto - Puesto a crear
   * @returns El puesto creado
   * @throws DuplicatePuestoError si el nombre ya existe
   */
  create(puesto: Puesto): Promise<Puesto>;

  /**
   * Actualiza un puesto existente
   * @param puesto - Puesto con los cambios
   * @returns El puesto actualizado
   * @throws PuestoNotFoundError si el puesto no existe
   */
  update(puesto: Puesto): Promise<Puesto>;

  /**
   * Elimina un puesto (baja lógica - marca como inactivo)
   * @param id - ID del puesto a eliminar
   * @returns true si se eliminó, false si no existía
   */
  delete(id: string): Promise<boolean>;

  /**
   * Busca todos los puestos con filtros opcionales
   * @param filters - Filtros opcionales
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Lista de puestos y total
   */
  findAll(
    filters?: {
      isActive?: boolean;
      search?: string; // Búsqueda por nombre
    },
    limit?: number,
    offset?: number,
    sortBy?: 'nombre' | 'createdAt',
    sortOrder?: 'asc' | 'desc'
  ): Promise<{ puestos: Puesto[]; total: number }>;

  /**
   * Verifica si existe un puesto con el nombre dado
   */
  existsByNombre(nombre: string): Promise<boolean>;

  /**
   * Cuenta cuántos colaboradores tienen asociado este puesto
   * @param puestoId - ID del puesto
   * @param isActive - Contar solo colaboradores activos (opcional)
   * @returns Número de colaboradores
   */
  countCollaboratorsByPuestoId(puestoId: string, isActive?: boolean): Promise<number>;
}
