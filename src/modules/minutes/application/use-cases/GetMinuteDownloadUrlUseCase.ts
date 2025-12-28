import { IEventBus, ILogger } from '@shared/domain';
import { MinuteNotFoundError, MinuteDownloaded } from '../../domain';
import { IMinuteRepository } from '../../domain/ports/output/IMinuteRepository';
import { IFileStorageService } from '@modules/documents/domain/ports/output/IFileStorageService';
import { IGetMinuteDownloadUrlUseCase } from '../ports/input/IGetMinuteDownloadUrlUseCase';

/**
 * Caso de uso para obtener la URL de descarga/visualización de una minuta
 * 
 * Se encarga de:
 * - Validar que la minuta existe y está activa
 * - Generar la URL completa del archivo
 * - Publicar evento de dominio (MinuteDownloaded) para auditoría
 */
export class GetMinuteDownloadUrlUseCase implements IGetMinuteDownloadUrlUseCase {
  constructor(
    private readonly minuteRepository: IMinuteRepository,
    private readonly fileStorageService: IFileStorageService,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID de la minuta
   * @param viewedBy - ID del usuario que está visualizando la minuta
   * @returns URL completa del archivo, nombre del archivo y tipo MIME
   * @throws MinuteNotFoundError si la minuta no existe
   */
  async execute(
    id: string,
    viewedBy?: string
  ): Promise<{ url: string; fileName: string; fileType: string }> {
    this.logger.debug('Ejecutando caso de uso: Obtener URL de descarga', {
      minuteId: id,
      viewedBy,
    });

    // Verificar que la minuta existe
    const minute = await this.minuteRepository.findById(id);
    if (!minute) {
      this.logger.warn('Intento de obtener URL de minuta inexistente', {
        minuteId: id,
        viewedBy,
      });
      throw new MinuteNotFoundError(id);
    }

    // Verificar que la minuta está activa
    if (!minute.isActive) {
      this.logger.warn('Intento de obtener URL de minuta inactiva', {
        minuteId: id,
        viewedBy,
      });
      throw new MinuteNotFoundError(id);
    }

    // Generar URL completa del archivo
    const url = this.fileStorageService.getFileUrl(minute.fileUrl);

    // Publicar evento de dominio para auditoría
    await this.eventBus.publish(new MinuteDownloaded(minute, viewedBy));

    this.logger.debug('URL de descarga generada exitosamente', {
      minuteId: id,
      fileName: minute.fileName,
      viewedBy,
    });

    return {
      url,
      fileName: minute.fileName,
      fileType: minute.fileType,
    };
  }
}
