import { Area } from '../../entities/Area';

/**
 * Interfaz del repositorio de áreas
 * Define el contrato para persistir y recuperar áreas
 * 
 * Este es un Output Port (Driven Port) - el dominio define lo que necesita
 */
export interface IAreaRepository {
  /**
   * Busca un área por su ID
   * @returns Area si existe, null si no existe
   */
  findById(id: string): Promise<Area | null>;

  /**
   * Busca un área por su nombre
   * @returns Area si existe, null si no existe
   */
  findByNombre(nombre: string): Promise<Area | null>;

  /**
   * Guarda un área (crea o actualiza)
   * @param area - Área a guardar
   * @returns El área guardada
   */
  save(area: Area): Promise<Area>;

  /**
   * Crea un nuevo área
   * @param area - Área a crear
   * @returns El área creada
   * @throws DuplicateAreaError si el nombre ya existe
   */
  create(area: Area): Promise<Area>;

  /**
   * Actualiza un área existente
   * @param area - Área con los cambios
   * @returns El área actualizada
   * @throws AreaNotFoundError si el área no existe
   */
  update(area: Area): Promise<Area>;

  /**
   * Elimina un área (baja lógica - marca como inactivo)
   * @param id - ID del área a eliminar
   * @returns true si se eliminó, false si no existía
   */
  delete(id: string): Promise<boolean>;

  /**
   * Busca todas las áreas con filtros opcionales
   * @param filters - Filtros opcionales
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Lista de áreas y total
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
  ): Promise<{ areas: Area[]; total: number }>;

  /**
   * Verifica si existe un área con el nombre dado
   */
  existsByNombre(nombre: string): Promise<boolean>;

  /**
   * Cuenta cuántos colaboradores tienen asociado este área
   * @param areaId - ID del área
   * @param isActive - Contar solo colaboradores activos (opcional)
   * @returns Número de colaboradores
   */
  countCollaboratorsByAreaId(areaId: string, isActive?: boolean): Promise<number>;
}
