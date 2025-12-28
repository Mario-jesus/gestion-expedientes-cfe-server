import { IEventBus, ILogger } from '@shared/domain';
import { DocumentType } from '../../../domain/entities/DocumentType';
import { DuplicateDocumentTypeError } from '../../../domain/exceptions/DuplicateDocumentTypeError';
import { DocumentTypeCreated } from '../../../domain/events/DocumentTypeCreated';
import { IDocumentTypeRepository } from '../../../domain/ports/output/IDocumentTypeRepository';
import { ICreateDocumentTypeUseCase } from '../../ports/input/documentTypes/ICreateDocumentTypeUseCase';
import { CreateDocumentTypeDTO } from '../../dto/documentTypes/CreateDocumentTypeDTO';

/**
 * Caso de uso para crear un nuevo tipo de documento
 */
export class CreateDocumentTypeUseCase implements ICreateDocumentTypeUseCase {
  constructor(
    private readonly documentTypeRepository: IDocumentTypeRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(dto: CreateDocumentTypeDTO, createdBy?: string): Promise<DocumentType> {
    this.logger.info('Ejecutando caso de uso: Crear tipo de documento', {
      nombre: dto.nombre,
      kind: dto.kind,
      createdBy,
    });

    // Validar que el nombre no exista en el kind
    const nombreExists = await this.documentTypeRepository.existsByNombreAndKind(
      dto.nombre,
      dto.kind
    );
    if (nombreExists) {
      this.logger.warn('Intento de crear tipo de documento con nombre duplicado en el kind', {
        nombre: dto.nombre,
        kind: dto.kind,
        createdBy,
      });
      throw new DuplicateDocumentTypeError(dto.nombre, dto.kind);
    }

    // Crear la entidad DocumentType
    const documentType = DocumentType.create({
      nombre: dto.nombre,
      kind: dto.kind,
      descripcion: dto.descripcion,
      isActive: dto.isActive ?? true,
    });

    // Persistir el tipo de documento
    const savedDocumentType = await this.documentTypeRepository.create(documentType);

    // Publicar evento de dominio
    await this.eventBus.publish(new DocumentTypeCreated(savedDocumentType, createdBy));

    this.logger.info('Tipo de documento creado exitosamente', {
      documentTypeId: savedDocumentType.id,
      nombre: savedDocumentType.nombre,
      kind: savedDocumentType.kind,
      createdBy,
    });

    return savedDocumentType;
  }
}
