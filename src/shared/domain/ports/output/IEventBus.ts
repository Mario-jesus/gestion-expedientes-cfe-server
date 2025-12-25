import { DomainEvent } from '../../entities/DomainEvent';

/**
 * Interfaz para el Event Bus
 * Permite publicar y suscribirse a eventos de dominio
 */
export interface IEventBus {
  /**
   * Publica un evento de dominio
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Suscribe un handler a un tipo de evento
   * @param eventName Nombre del evento (clase del evento)
   * @param handler Función que procesa el evento
   */
  subscribe(eventName: string, handler: (event: DomainEvent) => Promise<void>): void;

  /**
   * Desuscribe un handler de un tipo de evento
   */
  unsubscribe(eventName: string, handler: Function): void;
}
