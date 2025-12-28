import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { Minute } from '../entities/Minute';

/**
 * Evento de dominio que se dispara cuando se descarga/visualiza una minuta
 */
export class MinuteDownloaded extends DomainEvent {
  /**
   * Minuta descargada/visualizada
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
    return 'minute.downloaded';
  }
}
