import { IEventBus, ILogger } from '@shared/domain';
import { config } from '@shared/config';
import { CollaboratorDocument, DocumentCreated, DocumentKind } from '../../domain';
import { InvalidFileTypeError } from '../../domain/exceptions/InvalidFileTypeError';
import { FileSizeExceededError } from '../../domain/exceptions/FileSizeExceededError';
import { DuplicateDocumentError } from '../../domain/exceptions/DuplicateDocumentError';
import { IDocumentRepository, IFileStorageService } from '../../domain/ports/output';
import type { UploadedFile } from '../../domain/ports/output/IFileStorageService';
import { ICollaboratorRepository } from '@modules/collaborators/domain/ports/output/ICollaboratorRepository';
import { CollaboratorNotFoundError } from '@modules/collaborators/domain/exceptions/CollaboratorNotFoundError';
import { ICreateDocumentUseCase } from '../ports/input/ICreateDocumentUseCase';
import { CreateDocumentDTO } from '../dto/CreateDocumentDTO';
import path from 'path';
import crypto from 'crypto';

/**
 * Caso de uso para crear un nuevo documento
 * 
 * Se encarga de:
 * - Validar que el colaborador existe
 * - Validar tipo y tamaño del archivo
 * - Generar nombre único para el archivo
 * - Guardar el archivo físico
 * - Crear la entidad CollaboratorDocument
 * - Persistir el documento
 * - Publicar eventos de dominio (DocumentCreated)
 */
export class CreateDocumentUseCase implements ICreateDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly fileStorageService: IFileStorageService,
    private readonly collaboratorRepository: ICollaboratorRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con los datos del documento a crear
   * @param file - Archivo a subir (Buffer o UploadedFile)
   * @param uploadedBy - ID del usuario que está subiendo el documento
   * @returns El documento creado
   */
  async execute(
    dto: CreateDocumentDTO,
    file: Buffer | UploadedFile,
    uploadedBy: string
  ): Promise<CollaboratorDocument> {
    this.logger.info('Ejecutando caso de uso: Crear documento', {
      collaboratorId: dto.collaboratorId,
      kind: dto.kind,
      uploadedBy,
    });

    // Validar que el colaborador existe
    const collaborator = await this.collaboratorRepository.findById(dto.collaboratorId);
    if (!collaborator) {
      this.logger.warn('Intento de crear documento para colaborador inexistente', {
        collaboratorId: dto.collaboratorId,
        uploadedBy,
      });
      throw new CollaboratorNotFoundError(dto.collaboratorId);
    }

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

    // Validar duplicados para tipos que deben ser únicos (bateria, perfil)
    // Nota: Esto es una validación opcional, según requerimientos puede ser más flexible
    if (dto.kind === DocumentKind.BATERIA || dto.kind === DocumentKind.PERFIL) {
      const exists = await this.documentRepository.existsByCollaboratorAndKind(
        dto.collaboratorId,
        dto.kind
      );
      if (exists) {
        this.logger.warn('Intento de crear documento duplicado', {
          collaboratorId: dto.collaboratorId,
          kind: dto.kind,
          uploadedBy,
        });
        throw new DuplicateDocumentError(dto.collaboratorId, dto.kind);
      }
    }

    // Generar nombre único para el archivo
    const fileExtension = path.extname(originalName) || this.getExtensionFromMimeType(fileType);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex');
    const fileName = `${dto.kind}_${timestamp}_${randomString}${fileExtension}`;

    // Guardar archivo físico
    const folder = 'documents'; // Carpeta para documentos de colaboradores
    const { fileUrl } = await this.fileStorageService.saveFile(fileBuffer, fileName, folder);

    // Crear la entidad CollaboratorDocument
    const document = CollaboratorDocument.create(
      {
        collaboratorId: dto.collaboratorId,
        kind: dto.kind,
        periodo: dto.periodo,
        descripcion: dto.descripcion,
        fileName,
        fileUrl,
        fileSize,
        fileType,
        uploadedBy,
        uploadedAt: new Date(),
        documentTypeId: dto.documentTypeId,
        isActive: true,
      }
    );

    // Persistir el documento
    const savedDocument = await this.documentRepository.create(document);

    // Publicar evento de dominio
    await this.eventBus.publish(new DocumentCreated(savedDocument, uploadedBy));

    this.logger.info('Documento creado exitosamente', {
      documentId: savedDocument.id,
      collaboratorId: dto.collaboratorId,
      kind: dto.kind,
      fileName,
      uploadedBy,
    });

    return savedDocument;
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
