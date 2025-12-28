import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { Adscripcion } from '../entities/Adscripcion';

/**
 * Evento de dominio que se dispara cuando se crea una nueva adscripción
 */
export class AdscripcionCreated extends DomainEvent {
  /**
   * Adscripción creada
   */
  public readonly adscripcion: Adscripcion;

  /**
   * ID del usuario que realizó la acción (quien creó la adscripción)
   */
  public readonly performedBy: string | undefined;

  constructor(adscripcion: Adscripcion, performedBy?: string) {
    super();
    this.adscripcion = adscripcion;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'adscripcion.created';
  }
}
