import { CollaboratorDocument } from '../../entities/CollaboratorDocument';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';

/**
 * Interfaz del repositorio de documentos
 * Define el contrato para persistir y recuperar documentos
 * 
 * Este es un Output Port (Driven Port) - el dominio define lo que necesita
 */
export interface IDocumentRepository {
  /**
   * Busca un documento por su ID
   * @returns CollaboratorDocument si existe, null si no existe
   */
  findById(id: string): Promise<CollaboratorDocument | null>;

  /**
   * Guarda un documento (crea o actualiza)
   * @param document - Documento a guardar
   * @returns El documento guardado
   */
  save(document: CollaboratorDocument): Promise<CollaboratorDocument>;

  /**
   * Crea un nuevo documento
   * @param document - Documento a crear
   * @returns El documento creado
   */
  create(document: CollaboratorDocument): Promise<CollaboratorDocument>;

  /**
   * Actualiza un documento existente
   * @param document - Documento con los cambios
   * @returns El documento actualizado
   * @throws DocumentNotFoundError si el documento no existe
   */
  update(document: CollaboratorDocument): Promise<CollaboratorDocument>;

  /**
   * Elimina un documento (baja lógica - marca como inactivo)
   * @param id - ID del documento a eliminar
   * @returns true si se eliminó, false si no existía
   */
  delete(id: string): Promise<boolean>;

  /**
   * Busca todos los documentos con filtros opcionales
   * @param filters - Filtros opcionales
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Lista de documentos y total
   */
  findAll(
    filters?: {
      collaboratorId?: string;
      kind?: DocumentKind;
      isActive?: boolean;
      documentTypeId?: string;
    },
    limit?: number,
    offset?: number
  ): Promise<{ documents: CollaboratorDocument[]; total: number }>;

  /**
   * Busca documentos por colaborador
   * @param collaboratorId - ID del colaborador
   * @param filters - Filtros adicionales opcionales
   * @returns Lista de documentos del colaborador
   */
  findByCollaboratorId(
    collaboratorId: string,
    filters?: {
      kind?: DocumentKind;
      isActive?: boolean;
    }
  ): Promise<CollaboratorDocument[]>;

  /**
   * Verifica si existe un documento de un tipo específico para un colaborador
   * Útil para validar que no haya duplicados (ej: solo una batería por colaborador)
   * @param collaboratorId - ID del colaborador
   * @param kind - Tipo de documento
   * @param excludeDocumentId - ID de documento a excluir (útil para updates)
   * @returns true si existe, false si no existe
   */
  existsByCollaboratorAndKind(
    collaboratorId: string,
    kind: DocumentKind,
    excludeDocumentId?: string
  ): Promise<boolean>;

  /**
   * Cuenta documentos por colaborador y tipo
   * @param collaboratorId - ID del colaborador
   * @param kind - Tipo de documento
   * @param isActive - Si solo contar activos (default: true)
   * @returns Número de documentos
   */
  countByCollaboratorAndKind(
    collaboratorId: string,
    kind: DocumentKind,
    isActive?: boolean
  ): Promise<number>;
}
