import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { CollaboratorDocument } from '../entities/CollaboratorDocument';

/**
 * Evento de dominio que se dispara cuando se descarga/visualiza un documento
 */
export class DocumentDownloaded extends DomainEvent {
  /**
   * Documento descargado/visualizado
   */
  public readonly document: CollaboratorDocument;

  /**
   * ID del usuario que realizó la acción
   */
  public readonly performedBy: string | undefined;

  constructor(document: CollaboratorDocument, performedBy?: string) {
    super();
    this.document = document;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'document.downloaded';
  }
}
