import { IEventBus, ILogger } from '@shared/domain';
import { DocumentTypeNotFoundError } from '../../../domain/exceptions/DocumentTypeNotFoundError';
import { DocumentTypeInUseError } from '../../../domain/exceptions/DocumentTypeInUseError';
import { DocumentTypeDeleted } from '../../../domain/events/DocumentTypeDeleted';
import { IDocumentTypeRepository } from '../../../domain/ports/output/IDocumentTypeRepository';
import { IDeleteDocumentTypeUseCase } from '../../ports/input/documentTypes/IDeleteDocumentTypeUseCase';

/**
 * Caso de uso para eliminar un tipo de documento
 * 
 * Reglas de negocio:
 * - No se puede eliminar si tiene documentos asociados
 */
export class DeleteDocumentTypeUseCase implements IDeleteDocumentTypeUseCase {
  constructor(
    private readonly documentTypeRepository: IDocumentTypeRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(documentTypeId: string, performedBy?: string): Promise<boolean> {
    this.logger.info('Ejecutando caso de uso: Eliminar tipo de documento', {
      targetDocumentTypeId: documentTypeId,
      performedBy,
    });

    // Verificar que el tipo de documento existe
    const documentType = await this.documentTypeRepository.findById(documentTypeId);
    if (!documentType) {
      this.logger.warn('Intento de eliminar tipo de documento inexistente', {
        targetDocumentTypeId: documentTypeId,
        performedBy,
      });
      throw new DocumentTypeNotFoundError(documentTypeId);
    }

    // Verificar si tiene documentos asociados
    const documentsCount = await this.documentTypeRepository.countDocumentsByDocumentTypeId(
      documentTypeId
    );
    if (documentsCount > 0) {
      this.logger.warn('Intento de eliminar tipo de documento con documentos asociados', {
        targetDocumentTypeId: documentTypeId,
        documentsCount,
        performedBy,
      });
      throw new DocumentTypeInUseError(documentTypeId);
    }

    // Eliminar el tipo de documento (baja lógica)
    const deleted = await this.documentTypeRepository.delete(documentTypeId);

    if (deleted) {
      // Publicar evento de dominio solo si se eliminó correctamente
      await this.eventBus.publish(new DocumentTypeDeleted(documentType, performedBy));
      this.logger.info('Tipo de documento eliminado exitosamente', {
        targetDocumentTypeId: documentTypeId,
        performedBy,
      });
    }

    return deleted;
  }
}
