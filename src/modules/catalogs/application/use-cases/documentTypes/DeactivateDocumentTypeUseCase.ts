import { IEventBus, ILogger } from '@shared/domain';
import { DocumentType } from '../../../domain/entities/DocumentType';
import { DocumentTypeNotFoundError } from '../../../domain/exceptions/DocumentTypeNotFoundError';
import { DocumentTypeDeactivated } from '../../../domain/events/DocumentTypeDeactivated';
import { IDocumentTypeRepository } from '../../../domain/ports/output/IDocumentTypeRepository';
import { IDeactivateDocumentTypeUseCase } from '../../ports/input/documentTypes/IDeactivateDocumentTypeUseCase';

/**
 * Caso de uso para desactivar un tipo de documento
 */
export class DeactivateDocumentTypeUseCase implements IDeactivateDocumentTypeUseCase {
  constructor(
    private readonly documentTypeRepository: IDocumentTypeRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(documentTypeId: string, performedBy?: string): Promise<DocumentType> {
    this.logger.info('Ejecutando caso de uso: Desactivar tipo de documento', {
      targetDocumentTypeId: documentTypeId,
      performedBy,
    });

    const documentType = await this.documentTypeRepository.findById(documentTypeId);
    if (!documentType) {
      this.logger.warn('Intento de desactivar tipo de documento inexistente', {
        targetDocumentTypeId: documentTypeId,
        performedBy,
      });
      throw new DocumentTypeNotFoundError(documentTypeId);
    }

    documentType.deactivate();

    const updatedDocumentType = await this.documentTypeRepository.update(documentType);

    await this.eventBus.publish(new DocumentTypeDeactivated(updatedDocumentType, performedBy));

    this.logger.info('Tipo de documento desactivado exitosamente', {
      targetDocumentTypeId: documentTypeId,
      performedBy,
    });

    return updatedDocumentType;
  }
}
