import { IEventBus, ILogger } from '@shared/domain';
import { DocumentType } from '../../../domain/entities/DocumentType';
import { DocumentTypeNotFoundError } from '../../../domain/exceptions/DocumentTypeNotFoundError';
import { DocumentTypeActivated } from '../../../domain/events/DocumentTypeActivated';
import { IDocumentTypeRepository } from '../../../domain/ports/output/IDocumentTypeRepository';
import { IActivateDocumentTypeUseCase } from '../../ports/input/documentTypes/IActivateDocumentTypeUseCase';

/**
 * Caso de uso para activar un tipo de documento
 */
export class ActivateDocumentTypeUseCase implements IActivateDocumentTypeUseCase {
  constructor(
    private readonly documentTypeRepository: IDocumentTypeRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(documentTypeId: string, performedBy?: string): Promise<DocumentType> {
    this.logger.info('Ejecutando caso de uso: Activar tipo de documento', {
      targetDocumentTypeId: documentTypeId,
      performedBy,
    });

    const documentType = await this.documentTypeRepository.findById(documentTypeId);
    if (!documentType) {
      this.logger.warn('Intento de activar tipo de documento inexistente', {
        targetDocumentTypeId: documentTypeId,
        performedBy,
      });
      throw new DocumentTypeNotFoundError(documentTypeId);
    }

    documentType.activate();

    const updatedDocumentType = await this.documentTypeRepository.update(documentType);

    await this.eventBus.publish(new DocumentTypeActivated(updatedDocumentType, performedBy));

    this.logger.info('Tipo de documento activado exitosamente', {
      targetDocumentTypeId: documentTypeId,
      performedBy,
    });

    return updatedDocumentType;
  }
}
