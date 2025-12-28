import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { Minute } from '../entities/Minute';

/**
 * Evento de dominio que se dispara cuando se elimina una minuta (baja lógica)
 */
export class MinuteDeleted extends DomainEvent {
  /**
   * Minuta eliminada
   */
  public readonly minute: Minute;

  /**
   * ID del usuario que realizó la acción
   */
  public readonly performedBy: string | undefined;

  constructor(minute: Minute, performedBy?: string) {
    super();
    this.minute = minute;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'minute.deleted';
  }
}
