import { IEventBus, ILogger } from '@shared/domain';
import { config } from '@shared/config';
import { Minute, MinuteCreated } from '../../domain';
import { InvalidFileTypeError } from '@modules/documents/domain/exceptions/InvalidFileTypeError';
import { FileSizeExceededError } from '@modules/documents/domain/exceptions/FileSizeExceededError';
import { IMinuteRepository } from '../../domain/ports/output/IMinuteRepository';
import { IFileStorageService, UploadedFile } from '@modules/documents/domain/ports/output/IFileStorageService';
import { ICreateMinuteUseCase } from '../ports/input/ICreateMinuteUseCase';
import { CreateMinuteDTO } from '../dto/CreateMinuteDTO';
import path from 'path';
import crypto from 'crypto';

/**
 * Caso de uso para crear una nueva minuta
 * 
 * Se encarga de:
 * - Validar tipo y tamaño del archivo
 * - Generar nombre único para el archivo
 * - Guardar el archivo físico
 * - Crear la entidad Minute
 * - Persistir la minuta
 * - Publicar eventos de dominio (MinuteCreated)
 */
export class CreateMinuteUseCase implements ICreateMinuteUseCase {
  constructor(
    private readonly minuteRepository: IMinuteRepository,
    private readonly fileStorageService: IFileStorageService,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con los datos de la minuta a crear
   * @param file - Archivo a subir (Buffer o UploadedFile)
   * @param uploadedBy - ID del usuario que está subiendo la minuta
   * @returns La minuta creada
   */
  async execute(
    dto: CreateMinuteDTO,
    file: Buffer | UploadedFile,
    uploadedBy: string
  ): Promise<Minute> {
    this.logger.info('Ejecutando caso de uso: Crear minuta', {
      titulo: dto.titulo,
      tipo: dto.tipo,
      uploadedBy,
    });

    // Obtener información del archivo
    const fileBuffer = Buffer.isBuffer(file) ? file : (file.buffer || Buffer.from(''));
    const fileSize = Buffer.isBuffer(file) ? file.length : file.size;
    const fileType = Buffer.isBuffer(file) ? 'application/octet-stream' : file.mimetype;
    const originalName = Buffer.isBuffer(file) ? 'file' : file.originalname;

    // Validar tamaño del archivo
    const maxFileSize = config.fileStorage.maxFileSize;
    if (fileSize > maxFileSize) {
      this.logger.warn('Intento de subir archivo que excede el tamaño máximo', {
        fileSize,
        maxFileSize,
        uploadedBy,
      });
      throw new FileSizeExceededError(fileSize, maxFileSize);
    }

    // Validar tipo de archivo
    const allowedTypes = config.fileStorage.allowedFileTypes;
    if (!allowedTypes.includes(fileType)) {
      this.logger.warn('Intento de subir archivo con tipo no permitido', {
        fileType,
        allowedTypes,
        uploadedBy,
      });
      throw new InvalidFileTypeError(fileType, allowedTypes);
    }

    // Convertir fecha si viene como string
    const fecha = dto.fecha instanceof Date ? dto.fecha : new Date(dto.fecha);

    // Validar que la fecha sea válida
    if (isNaN(fecha.getTime())) {
      throw new Error('La fecha debe ser una fecha válida');
    }

    // Generar nombre único para el archivo
    const fileExtension = path.extname(originalName) || this.getExtensionFromMimeType(fileType);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex');
    const fileName = `minuta_${timestamp}_${randomString}${fileExtension}`;

    // Guardar archivo físico
    const folder = 'minutes'; // Carpeta para minutas
    const { fileUrl } = await this.fileStorageService.saveFile(fileBuffer, fileName, folder);

    // Crear la entidad Minute
    const minute = Minute.create(
      {
        titulo: dto.titulo,
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        fecha,
        fileName,
        fileUrl,
        fileSize,
        fileType,
        uploadedBy,
        uploadedAt: new Date(),
        isActive: true,
      }
    );

    // Persistir la minuta
    const savedMinute = await this.minuteRepository.create(minute);

    // Publicar evento de dominio
    await this.eventBus.publish(new MinuteCreated(savedMinute, uploadedBy));

    this.logger.info('Minuta creada exitosamente', {
      minuteId: savedMinute.id,
      titulo: dto.titulo,
      tipo: dto.tipo,
      fileName,
      uploadedBy,
    });

    return savedMinute;
  }

  /**
   * Obtiene la extensión de archivo basada en el tipo MIME
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
    };

    return mimeToExt[mimeType] || '.bin';
  }
}
