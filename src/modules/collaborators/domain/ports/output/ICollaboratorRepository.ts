import { Collaborator } from '../../entities/Collaborator';

/**
 * Interfaz del repositorio de colaboradores
 * Define el contrato para persistir y recuperar colaboradores
 * 
 * Este es un Output Port (Driven Port) - el dominio define lo que necesita
 */
export interface ICollaboratorRepository {
  /**
   * Busca un colaborador por su ID
   * @returns Collaborator si existe, null si no existe
   */
  findById(id: string): Promise<Collaborator | null>;

  /**
   * Busca un colaborador por su RPE
   * @returns Collaborator si existe, null si no existe
   */
  findByRPE(rpe: string): Promise<Collaborator | null>;

  /**
   * Guarda un colaborador (crea o actualiza)
   * @param collaborator - Colaborador a guardar
   * @returns El colaborador guardado
   */
  save(collaborator: Collaborator): Promise<Collaborator>;

  /**
   * Crea un nuevo colaborador
   * @param collaborator - Colaborador a crear
   * @returns El colaborador creado
   * @throws DuplicateCollaboratorError si el RPE ya existe
   */
  create(collaborator: Collaborator): Promise<Collaborator>;

  /**
   * Actualiza un colaborador existente
   * @param collaborator - Colaborador con los cambios
   * @returns El colaborador actualizado
   * @throws CollaboratorNotFoundError si el colaborador no existe
   */
  update(collaborator: Collaborator): Promise<Collaborator>;

  /**
   * Elimina un colaborador (baja lógica - marca como inactivo)
   * @param id - ID del colaborador a eliminar
   * @returns true si se eliminó, false si no existía
   */
  delete(id: string): Promise<boolean>;

  /**
   * Busca todos los colaboradores con filtros opcionales
   * @param filters - Filtros opcionales
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Lista de colaboradores y total
   */
  findAll(
    filters?: {
      areaId?: string;
      adscripcionId?: string;
      puestoId?: string;
      tipoContrato?: string;
      isActive?: boolean;
      search?: string; // Búsqueda por nombre, apellidos o RPE
      estadoExpediente?: 'completo' | 'incompleto' | 'sin_documentos';
    },
    limit?: number,
    offset?: number,
    sortBy?: 'nombre' | 'rpe' | 'createdAt',
    sortOrder?: 'asc' | 'desc'
  ): Promise<{ collaborators: Collaborator[]; total: number }>;

  /**
   * Verifica si existe un colaborador con el RPE dado
   */
  existsByRPE(rpe: string): Promise<boolean>;

  /**
   * Busca colaboradores por área
   * @param areaId - ID del área
   * @param isActive - Filtrar solo activos (opcional)
   * @returns Lista de colaboradores del área
   */
  findByAreaId(areaId: string, isActive?: boolean): Promise<Collaborator[]>;

  /**
   * Busca colaboradores por adscripción
   * @param adscripcionId - ID de la adscripción
   * @param isActive - Filtrar solo activos (opcional)
   * @returns Lista de colaboradores de la adscripción
   */
  findByAdscripcionId(
    adscripcionId: string,
    isActive?: boolean
  ): Promise<Collaborator[]>;

  /**
   * Busca colaboradores por puesto
   * @param puestoId - ID del puesto
   * @param isActive - Filtrar solo activos (opcional)
   * @returns Lista de colaboradores con el puesto
   */
  findByPuestoId(puestoId: string, isActive?: boolean): Promise<Collaborator[]>;
}
