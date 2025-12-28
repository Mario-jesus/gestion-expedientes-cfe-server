import { IEventBus, ILogger } from '@shared/domain';
import { CollaboratorDocument, DocumentNotFoundError, DocumentUpdated } from '../../domain';
import { IDocumentRepository } from '../../domain/ports/output/IDocumentRepository';
import { IUpdateDocumentUseCase } from '../ports/input/IUpdateDocumentUseCase';
import { UpdateDocumentDTO } from '../dto/UpdateDocumentDTO';

/**
 * Caso de uso para actualizar un documento
 * 
 * Se encarga de:
 * - Validar que el documento existe
 * - Actualizar los campos permitidos (periodo, descripción, documentTypeId, isActive)
 * - Persistir los cambios
 * - Publicar eventos de dominio (DocumentUpdated)
 * 
 * Nota: collaboratorId y kind NO se pueden cambiar (requiere eliminar y crear nuevo)
 */
export class UpdateDocumentUseCase implements IUpdateDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID del documento a actualizar
   * @param dto - DTO con los campos a actualizar
   * @param updatedBy - ID del usuario que está actualizando el documento
   * @returns El documento actualizado
   * @throws DocumentNotFoundError si el documento no existe
   */
  async execute(id: string, dto: UpdateDocumentDTO, updatedBy?: string): Promise<CollaboratorDocument> {
    this.logger.info('Ejecutando caso de uso: Actualizar documento', {
      documentId: id,
      updatedBy,
      fields: Object.keys(dto),
    });

    // Verificar que el documento existe
    const existingDocument = await this.documentRepository.findById(id);
    if (!existingDocument) {
      this.logger.warn('Intento de actualizar documento inexistente', {
        documentId: id,
        updatedBy,
      });
      throw new DocumentNotFoundError(id);
    }

    // Actualizar campos permitidos
    const updatedFields: string[] = [];

    if (dto.periodo !== undefined) {
      existingDocument.updatePeriodo(dto.periodo);
      updatedFields.push('periodo');
    }

    if (dto.descripcion !== undefined) {
      existingDocument.updateDescripcion(dto.descripcion);
      updatedFields.push('descripcion');
    }

    if (dto.documentTypeId !== undefined) {
      existingDocument.updateDocumentTypeId(dto.documentTypeId);
      updatedFields.push('documentTypeId');
    }

    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        existingDocument.activate();
      } else {
        existingDocument.deactivate();
      }
      updatedFields.push('isActive');
    }

    // Persistir los cambios
    const updatedDocument = await this.documentRepository.update(existingDocument);

    // Publicar evento de dominio
    await this.eventBus.publish(new DocumentUpdated(updatedDocument, updatedBy, updatedFields));

    this.logger.info('Documento actualizado exitosamente', {
      documentId: id,
      updatedFields,
      updatedBy,
    });

    return updatedDocument;
  }
}
