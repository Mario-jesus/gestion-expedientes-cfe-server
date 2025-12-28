import { IEventBus, ILogger } from '@shared/domain';
import { DocumentType } from '../../../domain/entities/DocumentType';
import { DocumentTypeNotFoundError } from '../../../domain/exceptions/DocumentTypeNotFoundError';
import { DuplicateDocumentTypeError } from '../../../domain/exceptions/DuplicateDocumentTypeError';
import { DocumentTypeUpdated } from '../../../domain/events/DocumentTypeUpdated';
import { IDocumentTypeRepository } from '../../../domain/ports/output/IDocumentTypeRepository';
import { IUpdateDocumentTypeUseCase } from '../../ports/input/documentTypes/IUpdateDocumentTypeUseCase';
import { UpdateDocumentTypeDTO } from '../../dto/documentTypes/UpdateDocumentTypeDTO';

/**
 * Caso de uso para actualizar un tipo de documento existente
 */
export class UpdateDocumentTypeUseCase implements IUpdateDocumentTypeUseCase {
  constructor(
    private readonly documentTypeRepository: IDocumentTypeRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(
    documentTypeId: string,
    dto: UpdateDocumentTypeDTO,
    performedBy?: string
  ): Promise<DocumentType> {
    this.logger.info('Ejecutando caso de uso: Actualizar tipo de documento', {
      targetDocumentTypeId: documentTypeId,
      performedBy,
      fieldsToUpdate: {
        nombre: dto.nombre !== undefined,
        kind: dto.kind !== undefined,
        descripcion: dto.descripcion !== undefined,
        isActive: dto.isActive !== undefined,
      },
    });

    // Obtener el tipo de documento existente
    const documentType = await this.documentTypeRepository.findById(documentTypeId);
    if (!documentType) {
      this.logger.warn('Intento de actualizar tipo de documento inexistente', {
        targetDocumentTypeId: documentTypeId,
        performedBy,
      });
      throw new DocumentTypeNotFoundError(documentTypeId);
    }

    // Validar nombre único si se está actualizando
    const kindToUse = dto.kind ?? documentType.kind;
    if (dto.nombre !== undefined && dto.nombre !== documentType.nombre) {
      const nombreExists = await this.documentTypeRepository.existsByNombreAndKind(
        dto.nombre,
        kindToUse
      );
      if (nombreExists) {
        this.logger.warn('Intento de actualizar tipo de documento con nombre duplicado', {
          targetDocumentTypeId: documentTypeId,
          nombre: dto.nombre,
          kind: kindToUse,
          performedBy,
        });
        throw new DuplicateDocumentTypeError(dto.nombre, kindToUse);
      }
      documentType.updateNombre(dto.nombre);
    }

    // Actualizar kind si se proporciona
    if (dto.kind !== undefined && dto.kind !== documentType.kind) {
      documentType.updateKind(dto.kind);
    }

    // Actualizar descripción si se proporciona
    if (dto.descripcion !== undefined) {
      documentType.updateDescripcion(dto.descripcion);
    }

    // Actualizar estado si se proporciona
    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        documentType.activate();
      } else {
        documentType.deactivate();
      }
    }

    // Persistir los cambios
    const updatedDocumentType = await this.documentTypeRepository.update(documentType);

    // Publicar evento de dominio
    await this.eventBus.publish(new DocumentTypeUpdated(updatedDocumentType, performedBy));

    this.logger.info('Tipo de documento actualizado exitosamente', {
      targetDocumentTypeId: documentTypeId,
      performedBy,
    });

    return updatedDocumentType;
  }
}
