import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { CollaboratorDocument } from '../entities/CollaboratorDocument';

/**
 * Evento de dominio que se dispara cuando se crea un nuevo documento
 */
export class DocumentCreated extends DomainEvent {
  /**
   * Documento creado
   */
  public readonly document: CollaboratorDocument;

  /**
   * ID del usuario que realizó la acción (quien subió el documento)
   */
  public readonly performedBy: string | undefined;

  constructor(document: CollaboratorDocument, performedBy?: string) {
    super();
    this.document = document;
    // Si no se proporciona performedBy, usar document.uploadedBy
    this.performedBy = performedBy ?? document.uploadedBy;
  }

  getEventName(): string {
    return 'document.created';
  }
}
