import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { DocumentType } from '../entities/DocumentType';

/**
 * Evento de dominio que se dispara cuando se crea un nuevo tipo de documento
 */
export class DocumentTypeCreated extends DomainEvent {
  /**
   * Tipo de documento creado
   */
  public readonly documentType: DocumentType;

  /**
   * ID del usuario que realizó la acción (quien creó el tipo de documento)
   */
  public readonly performedBy: string | undefined;

  constructor(documentType: DocumentType, performedBy?: string) {
    super();
    this.documentType = documentType;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'documentType.created';
  }
}
