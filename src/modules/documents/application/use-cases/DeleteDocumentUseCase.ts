import { IEventBus, ILogger } from '@shared/domain';
import { DocumentNotFoundError, DocumentDeleted } from '../../domain';
import { IDocumentRepository } from '../../domain/ports/output/IDocumentRepository';
import { IDeleteDocumentUseCase } from '../ports/input/IDeleteDocumentUseCase';

/**
 * Caso de uso para eliminar un documento (baja lógica)
 * 
 * Se encarga de:
 * - Validar que el documento existe
 * - Marcar el documento como inactivo (baja lógica)
 * - Persistir los cambios
 * - Publicar eventos de dominio (DocumentDeleted)
 */
export class DeleteDocumentUseCase implements IDeleteDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID del documento a eliminar
   * @param deletedBy - ID del usuario que está eliminando el documento
   * @returns true si se eliminó, false si no existía
   * @throws DocumentNotFoundError si el documento no existe
   */
  async execute(id: string, deletedBy?: string): Promise<boolean> {
    this.logger.info('Ejecutando caso de uso: Eliminar documento', {
      documentId: id,
      deletedBy,
    });

    // Verificar que el documento existe antes de eliminarlo
    const document = await this.documentRepository.findById(id);
    if (!document) {
      this.logger.warn('Intento de eliminar documento inexistente', {
        documentId: id,
        deletedBy,
      });
      throw new DocumentNotFoundError(id);
    }

    // Eliminar el documento (baja lógica)
    const deleted = await this.documentRepository.delete(id);

    if (deleted) {
      // Publicar evento de dominio solo si se eliminó correctamente
      await this.eventBus.publish(new DocumentDeleted(document, deletedBy));
      this.logger.info('Documento eliminado exitosamente', {
        documentId: id,
        deletedBy,
      });
    }

    return deleted;
  }
}
