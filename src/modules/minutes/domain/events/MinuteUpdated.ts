import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { Minute } from '../entities/Minute';

/**
 * Evento de dominio que se dispara cuando se actualiza una minuta
 */
export class MinuteUpdated extends DomainEvent {
  /**
   * Minuta actualizada
   */
  public readonly minute: Minute;

  /**
   * ID del usuario que realizó la acción
   */
  public readonly performedBy: string | undefined;

  /**
   * Campos que fueron actualizados (opcional, para auditoría)
   */
  public readonly updatedFields?: string[] | undefined;

  constructor(
    minute: Minute,
    performedBy?: string,
    updatedFields?: string[] | undefined
  ) {
    super();
    this.minute = minute;
    this.performedBy = performedBy;
    this.updatedFields = updatedFields;
  }

  getEventName(): string {
    return 'minute.updated';
  }
}
