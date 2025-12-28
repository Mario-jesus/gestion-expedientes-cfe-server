import { DocumentType } from '../../entities/DocumentType';
import { DocumentKind } from '../../enums/DocumentKind';

/**
 * Interfaz del repositorio de tipos de documento
 * Define el contrato para persistir y recuperar tipos de documento
 * 
 * Este es un Output Port (Driven Port) - el dominio define lo que necesita
 */
export interface IDocumentTypeRepository {
  /**
   * Busca un tipo de documento por su ID
   * @returns DocumentType si existe, null si no existe
   */
  findById(id: string): Promise<DocumentType | null>;

  /**
   * Busca un tipo de documento por su nombre dentro de un kind
   * @param nombre - Nombre del tipo de documento
   * @param kind - Kind del tipo de documento
   * @returns DocumentType si existe, null si no existe
   */
  findByNombreAndKind(nombre: string, kind: DocumentKind): Promise<DocumentType | null>;

  /**
   * Guarda un tipo de documento (crea o actualiza)
   * @param documentType - Tipo de documento a guardar
   * @returns El tipo de documento guardado
   */
  save(documentType: DocumentType): Promise<DocumentType>;

  /**
   * Crea un nuevo tipo de documento
   * @param documentType - Tipo de documento a crear
   * @returns El tipo de documento creado
   * @throws DuplicateDocumentTypeError si el nombre ya existe en el kind
   */
  create(documentType: DocumentType): Promise<DocumentType>;

  /**
   * Actualiza un tipo de documento existente
   * @param documentType - Tipo de documento con los cambios
   * @returns El tipo de documento actualizado
   * @throws DocumentTypeNotFoundError si el tipo de documento no existe
   */
  update(documentType: DocumentType): Promise<DocumentType>;

  /**
   * Elimina un tipo de documento (baja lógica - marca como inactivo)
   * @param id - ID del tipo de documento a eliminar
   * @returns true si se eliminó, false si no existía
   */
  delete(id: string): Promise<boolean>;

  /**
   * Busca todos los tipos de documento con filtros opcionales
   * @param filters - Filtros opcionales
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Lista de tipos de documento y total
   */
  findAll(
    filters?: {
      kind?: DocumentKind;
      isActive?: boolean;
      search?: string; // Búsqueda por nombre
    },
    limit?: number,
    offset?: number,
    sortBy?: 'nombre' | 'kind' | 'createdAt',
    sortOrder?: 'asc' | 'desc'
  ): Promise<{ documentTypes: DocumentType[]; total: number }>;

  /**
   * Verifica si existe un tipo de documento con el nombre dado en el kind especificado
   */
  existsByNombreAndKind(nombre: string, kind: DocumentKind): Promise<boolean>;

  /**
   * Busca todos los tipos de documento de un kind específico
   * @param kind - Kind del tipo de documento
   * @param isActive - Filtrar solo activos (opcional)
   * @returns Lista de tipos de documento del kind
   */
  findByKind(kind: DocumentKind, isActive?: boolean): Promise<DocumentType[]>;

  /**
   * Cuenta cuántos documentos tienen asociado este tipo de documento
   * @param documentTypeId - ID del tipo de documento
   * @param isActive - Contar solo documentos activos (opcional)
   * @returns Número de documentos
   */
  countDocumentsByDocumentTypeId(
    documentTypeId: string,
    isActive?: boolean
  ): Promise<number>;
}
