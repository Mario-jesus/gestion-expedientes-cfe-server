import { IEventBus, ILogger } from '@shared/domain';
import { DocumentNotFoundError, DocumentDownloaded } from '../../domain';
import { IDocumentRepository, IFileStorageService } from '../../domain/ports/output';
import { IGetDocumentDownloadUrlUseCase } from '../ports/input/IGetDocumentDownloadUrlUseCase';

/**
 * Caso de uso para obtener la URL de descarga/visualización de un documento
 * 
 * Se encarga de:
 * - Validar que el documento existe y está activo
 * - Generar la URL completa del archivo
 * - Publicar evento de dominio (DocumentDownloaded) para auditoría
 */
export class GetDocumentDownloadUrlUseCase implements IGetDocumentDownloadUrlUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly fileStorageService: IFileStorageService,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID del documento
   * @param viewedBy - ID del usuario que está visualizando el documento
   * @returns URL completa del archivo, nombre del archivo y tipo MIME
   * @throws DocumentNotFoundError si el documento no existe
   */
  async execute(
    id: string,
    viewedBy?: string
  ): Promise<{ url: string; fileName: string; fileType: string }> {
    this.logger.debug('Ejecutando caso de uso: Obtener URL de descarga', {
      documentId: id,
      viewedBy,
    });

    // Verificar que el documento existe
    const document = await this.documentRepository.findById(id);
    if (!document) {
      this.logger.warn('Intento de obtener URL de documento inexistente', {
        documentId: id,
        viewedBy,
      });
      throw new DocumentNotFoundError(id);
    }

    // Verificar que el documento está activo
    if (!document.isActive) {
      this.logger.warn('Intento de obtener URL de documento inactivo', {
        documentId: id,
        viewedBy,
      });
      throw new DocumentNotFoundError(id);
    }

    // Generar URL completa del archivo
    const url = this.fileStorageService.getFileUrl(document.fileUrl);

    // Publicar evento de dominio para auditoría
    await this.eventBus.publish(new DocumentDownloaded(document, viewedBy));

    this.logger.debug('URL de descarga generada exitosamente', {
      documentId: id,
      fileName: document.fileName,
      viewedBy,
    });

    return {
      url,
      fileName: document.fileName,
      fileType: document.fileType,
    };
  }
}
