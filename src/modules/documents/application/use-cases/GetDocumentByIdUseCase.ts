import { ILogger } from '@shared/domain';
import { CollaboratorDocument, DocumentNotFoundError } from '../../domain';
import { IDocumentRepository } from '../../domain/ports/output/IDocumentRepository';
import { IGetDocumentByIdUseCase } from '../ports/input/IGetDocumentByIdUseCase';

/**
 * Caso de uso para obtener un documento por su ID
 */
export class GetDocumentByIdUseCase implements IGetDocumentByIdUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID del documento a buscar
   * @returns El documento encontrado
   * @throws DocumentNotFoundError si el documento no existe
   */
  async execute(id: string): Promise<CollaboratorDocument> {
    this.logger.debug('Ejecutando caso de uso: Obtener documento por ID', {
      documentId: id,
    });

    const document = await this.documentRepository.findById(id);

    if (!document) {
      this.logger.warn('Intento de obtener documento inexistente', {
        documentId: id,
      });
      throw new DocumentNotFoundError(id);
    }

    this.logger.debug('Documento obtenido exitosamente', {
      documentId: id,
      collaboratorId: document.collaboratorId,
      kind: document.kind,
    });

    return document;
  }
}
