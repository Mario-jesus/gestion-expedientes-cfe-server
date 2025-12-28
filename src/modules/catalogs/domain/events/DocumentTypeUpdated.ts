import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { DocumentType } from '../entities/DocumentType';

/**
 * Evento de dominio que se dispara cuando se actualiza un tipo de documento
 */
export class DocumentTypeUpdated extends DomainEvent {
  /**
   * Tipo de documento actualizado
   */
  public readonly documentType: DocumentType;

  /**
   * ID del usuario que realizó la acción
   */
  public readonly performedBy: string | undefined;

  constructor(documentType: DocumentType, performedBy?: string) {
    super();
    this.documentType = documentType;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'documentType.updated';
  }
}
