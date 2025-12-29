import { ILogger } from '@shared/domain';
import { CollaboratorDocument } from '@modules/documents/domain/entities/CollaboratorDocument';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';
import { IDocumentRepository } from '@modules/documents/domain/ports/output/IDocumentRepository';
import { IGetCollaboratorByIdUseCase } from '../ports/input/IGetCollaboratorByIdUseCase';
import { IGetDocumentsByCollaboratorIdUseCase } from '../ports/input/IGetDocumentsByCollaboratorIdUseCase';

/**
 * Caso de uso para obtener todos los documentos de un colaborador
 * 
 * Se encarga de:
 * - Validar que el colaborador existe
 * - Obtener documentos del colaborador con filtros opcionales
 * - Retornar lista de documentos ordenados por fecha de subida (más recientes primero)
 */
export class GetDocumentsByCollaboratorIdUseCase implements IGetDocumentsByCollaboratorIdUseCase {
  constructor(
    private readonly getCollaboratorByIdUseCase: IGetCollaboratorByIdUseCase,
    private readonly documentRepository: IDocumentRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param collaboratorId - ID del colaborador
   * @param filters - Filtros opcionales (kind, isActive)
   * @returns Lista de documentos del colaborador
   */
  async execute(
    collaboratorId: string,
    filters?: {
      kind?: DocumentKind;
      isActive?: boolean;
    }
  ): Promise<CollaboratorDocument[]> {
    this.logger.debug('Ejecutando caso de uso: Obtener documentos por colaborador', {
      collaboratorId,
      filters,
    });

    // Validar que el colaborador existe
    await this.getCollaboratorByIdUseCase.execute(collaboratorId);

    // Obtener documentos del colaborador con filtros
    const documents = await this.documentRepository.findByCollaboratorId(collaboratorId, filters);

    this.logger.debug('Documentos obtenidos exitosamente', {
      collaboratorId,
      total: documents.length,
      filters,
    });

    return documents;
  }
}
