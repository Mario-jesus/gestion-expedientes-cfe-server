/**
 * Clase base para todos los eventos de dominio
 * Sigue el patrón Domain Event de DDD
 */
export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;

  constructor() {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }

  /**
   * Nombre único del evento (usado para routing)
   */
  abstract getEventName(): string;

  /**
   * Versión del evento (útil para evolución del esquema)
   */
  getEventVersion(): number {
    return 1;
  }
}
