import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { Puesto } from '../entities/Puesto';

/**
 * Evento de dominio que se dispara cuando se elimina (baja lógica) un puesto
 */
export class PuestoDeleted extends DomainEvent {
  /**
   * Puesto eliminado
   */
  public readonly puesto: Puesto;

  /**
   * ID del usuario que realizó la acción
   */
  public readonly performedBy: string | undefined;

  constructor(puesto: Puesto, performedBy?: string) {
    super();
    this.puesto = puesto;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'puesto.deleted';
  }
}
