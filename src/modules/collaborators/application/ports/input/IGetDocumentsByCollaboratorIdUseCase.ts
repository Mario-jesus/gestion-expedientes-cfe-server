import { CollaboratorDocument } from '@modules/documents/domain/entities/CollaboratorDocument';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';

/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener documentos por colaborador
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface IGetDocumentsByCollaboratorIdUseCase {
  /**
   * Obtiene todos los documentos de un colaborador específico
   * @param collaboratorId - ID del colaborador
   * @param filters - Filtros opcionales (kind, isActive)
   * @returns Lista de documentos del colaborador
   * @throws CollaboratorNotFoundError si el colaborador no existe
   */
  execute(
    collaboratorId: string,
    filters?: {
      kind?: DocumentKind;
      isActive?: boolean;
    }
  ): Promise<CollaboratorDocument[]>;
}
