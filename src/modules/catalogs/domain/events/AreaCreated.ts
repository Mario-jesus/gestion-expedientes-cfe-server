import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { Area } from '../entities/Area';

/**
 * Evento de dominio que se dispara cuando se crea un nuevo área
 */
export class AreaCreated extends DomainEvent {
  /**
   * Área creada
   */
  public readonly area: Area;

  /**
   * ID del usuario que realizó la acción (quien creó el área)
   */
  public readonly performedBy: string | undefined;

  constructor(area: Area, performedBy?: string) {
    super();
    this.area = area;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'area.created';
  }
}
