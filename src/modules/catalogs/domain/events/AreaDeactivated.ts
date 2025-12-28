import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { Area } from '../entities/Area';

/**
 * Evento de dominio que se dispara cuando se desactiva un área
 */
export class AreaDeactivated extends DomainEvent {
  /**
   * Área desactivada
   */
  public readonly area: Area;

  /**
   * ID del usuario que realizó la acción
   */
  public readonly performedBy: string | undefined;

  constructor(area: Area, performedBy?: string) {
    super();
    this.area = area;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'area.deactivated';
  }
}
