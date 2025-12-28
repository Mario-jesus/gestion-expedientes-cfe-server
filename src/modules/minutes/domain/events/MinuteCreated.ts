import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { Minute } from '../entities/Minute';

/**
 * Evento de dominio que se dispara cuando se crea una nueva minuta
 */
export class MinuteCreated extends DomainEvent {
  /**
   * Minuta creada
   */
  public readonly minute: Minute;

  /**
   * ID del usuario que realizó la acción (quien subió la minuta)
   */
  public readonly performedBy: string | undefined;

  constructor(minute: Minute, performedBy?: string) {
    super();
    this.minute = minute;
    // Si no se proporciona performedBy, usar minute.uploadedBy
    this.performedBy = performedBy ?? minute.uploadedBy;
  }

  getEventName(): string {
    return 'minute.created';
  }
}
