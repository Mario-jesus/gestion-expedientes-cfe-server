import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { Adscripcion } from '../entities/Adscripcion';

/**
 * Evento de dominio que se dispara cuando se actualiza una adscripción
 */
export class AdscripcionUpdated extends DomainEvent {
  /**
   * Adscripción actualizada
   */
  public readonly adscripcion: Adscripcion;

  /**
   * ID del usuario que realizó la acción
   */
  public readonly performedBy: string | undefined;

  constructor(adscripcion: Adscripcion, performedBy?: string) {
    super();
    this.adscripcion = adscripcion;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'adscripcion.updated';
  }
}
