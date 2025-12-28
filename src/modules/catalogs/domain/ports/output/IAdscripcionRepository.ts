import { Adscripcion } from '../../entities/Adscripcion';

/**
 * Interfaz del repositorio de adscripciones
 * Define el contrato para persistir y recuperar adscripciones
 * 
 * Este es un Output Port (Driven Port) - el dominio define lo que necesita
 */
export interface IAdscripcionRepository {
  /**
   * Busca una adscripción por su ID
   * @returns Adscripcion si existe, null si no existe
   */
  findById(id: string): Promise<Adscripcion | null>;

  /**
   * Busca una adscripción por su nombre dentro de un área
   * @param nombre - Nombre de la adscripción
   * @param areaId - ID del área
   * @returns Adscripcion si existe, null si no existe
   */
  findByNombreAndAreaId(nombre: string, areaId: string): Promise<Adscripcion | null>;

  /**
   * Guarda una adscripción (crea o actualiza)
   * @param adscripcion - Adscripción a guardar
   * @returns La adscripción guardada
   */
  save(adscripcion: Adscripcion): Promise<Adscripcion>;

  /**
   * Crea una nueva adscripción
   * @param adscripcion - Adscripción a crear
   * @returns La adscripción creada
   * @throws DuplicateAdscripcionError si el nombre ya existe en el área
   */
  create(adscripcion: Adscripcion): Promise<Adscripcion>;

  /**
   * Actualiza una adscripción existente
   * @param adscripcion - Adscripción con los cambios
   * @returns La adscripción actualizada
   * @throws AdscripcionNotFoundError si la adscripción no existe
   */
  update(adscripcion: Adscripcion): Promise<Adscripcion>;

  /**
   * Elimina una adscripción (baja lógica - marca como inactivo)
   * @param id - ID de la adscripción a eliminar
   * @returns true si se eliminó, false si no existía
   */
  delete(id: string): Promise<boolean>;

  /**
   * Busca todas las adscripciones con filtros opcionales
   * @param filters - Filtros opcionales
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Lista de adscripciones y total
   */
  findAll(
    filters?: {
      areaId?: string;
      isActive?: boolean;
      search?: string; // Búsqueda por nombre
    },
    limit?: number,
    offset?: number,
    sortBy?: 'nombre' | 'createdAt',
    sortOrder?: 'asc' | 'desc'
  ): Promise<{ adscripciones: Adscripcion[]; total: number }>;

  /**
   * Verifica si existe una adscripción con el nombre dado en el área especificada
   */
  existsByNombreAndAreaId(nombre: string, areaId: string): Promise<boolean>;

  /**
   * Busca todas las adscripciones de un área
   * @param areaId - ID del área
   * @param isActive - Filtrar solo activas (opcional)
   * @returns Lista de adscripciones del área
   */
  findByAreaId(areaId: string, isActive?: boolean): Promise<Adscripcion[]>;

  /**
   * Cuenta cuántos colaboradores tienen asociada esta adscripción
   * @param adscripcionId - ID de la adscripción
   * @param isActive - Contar solo colaboradores activos (opcional)
   * @returns Número de colaboradores
   */
  countCollaboratorsByAdscripcionId(
    adscripcionId: string,
    isActive?: boolean
  ): Promise<number>;
}
