import { ILogger } from '@shared/domain';
import { DocumentType } from '../../../domain/entities/DocumentType';
import { DocumentTypeNotFoundError } from '../../../domain/exceptions/DocumentTypeNotFoundError';
import { IDocumentTypeRepository } from '../../../domain/ports/output/IDocumentTypeRepository';
import { IGetDocumentTypeByIdUseCase } from '../../ports/input/documentTypes/IGetDocumentTypeByIdUseCase';

/**
 * Caso de uso para obtener un tipo de documento por su ID
 */
export class GetDocumentTypeByIdUseCase implements IGetDocumentTypeByIdUseCase {
  constructor(
    private readonly documentTypeRepository: IDocumentTypeRepository,
    private readonly logger: ILogger
  ) {}

  async execute(id: string): Promise<DocumentType> {
    this.logger.debug('Ejecutando caso de uso: Obtener tipo de documento por ID', {
      documentTypeId: id,
    });

    const documentType = await this.documentTypeRepository.findById(id);

    if (!documentType) {
      this.logger.warn('Intento de obtener tipo de documento inexistente', {
        documentTypeId: id,
      });
      throw new DocumentTypeNotFoundError(id);
    }

    this.logger.debug('Tipo de documento obtenido exitosamente', {
      documentTypeId: id,
      nombre: documentType.nombre,
    });

    return documentType;
  }
}
