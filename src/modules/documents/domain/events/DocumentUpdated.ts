import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { CollaboratorDocument } from '../entities/CollaboratorDocument';

/**
 * Evento de dominio que se dispara cuando se actualiza un documento
 */
export class DocumentUpdated extends DomainEvent {
  /**
   * Documento actualizado
   */
  public readonly document: CollaboratorDocument;

  /**
   * ID del usuario que realizó la acción
   */
  public readonly performedBy: string | undefined;

  /**
   * Campos que fueron actualizados (opcional, para auditoría)
   */
  public readonly updatedFields?: string[] | undefined;

  constructor(
    document: CollaboratorDocument,
    performedBy?: string,
    updatedFields?: string[] | undefined
  ) {
    super();
    this.document = document;
    this.performedBy = performedBy;
    this.updatedFields = updatedFields;
  }

  getEventName(): string {
    return 'document.updated';
  }
}
