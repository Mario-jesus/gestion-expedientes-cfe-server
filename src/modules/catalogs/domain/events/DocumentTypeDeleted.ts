import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { DocumentType } from '../entities/DocumentType';

/**
 * Evento de dominio que se dispara cuando se elimina (baja lógica) un tipo de documento
 */
export class DocumentTypeDeleted extends DomainEvent {
  /**
   * Tipo de documento eliminado
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
    return 'documentType.deleted';
  }
}
