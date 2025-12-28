import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { Adscripcion } from '../entities/Adscripcion';

/**
 * Evento de dominio que se dispara cuando se elimina (baja lógica) una adscripción
 */
export class AdscripcionDeleted extends DomainEvent {
  /**
   * Adscripción eliminada
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
    return 'adscripcion.deleted';
  }
}
