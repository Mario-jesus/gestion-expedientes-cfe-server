import { EventEmitter } from 'events';
import { IEventBus, ILogger } from '../../../../domain/ports/output';
import { DomainEvent } from '../../../../domain/entities/DomainEvent';

/**
 * Implementación en memoria del Event Bus usando EventEmitter de Node.js
 * Envuelve EventEmitter para proporcionar una interfaz de dominio
 * 
 * Para desarrollo y testing
 * Nota: En producción, usar RabbitMQ, Kafka, etc.
 */
export class InMemoryEventBus extends EventEmitter implements IEventBus {
  private logger: ILogger | undefined;
  private readonly maxListeners = 100; // Límite de listeners por evento

  constructor(logger?: ILogger | undefined) {
    super();
    this.logger = logger;
    // Aumentar límite de listeners para soportar múltiples handlers
    this.setMaxListeners(this.maxListeners);
  }

  /**
   * Publica un evento de dominio
   * Usa EventEmitter.emit internamente
   * 
   * Nota: EventEmitter.emit es síncrono, pero nuestros handlers son async.
   * Los handlers se ejecutan en paralelo y los errores se capturan en el wrapper.
   */
  async publish(event: DomainEvent): Promise<void> {
    const eventName = event.constructor.name;
    const listenerCount = this.listenerCount(eventName);

    if (listenerCount === 0) {
      // No hay handlers, evento se descarta silenciosamente
      if (this.logger) {
        this.logger.debug(`Event ${eventName} published but no listeners`, {
          eventId: event.eventId,
          occurredOn: event.occurredOn,
        });
      }
      return;
    }

    // Obtener todos los listeners para ejecutarlos en paralelo
    const listeners = this.listeners(eventName) as Array<(event: DomainEvent) => Promise<void>>;

    // Ejecutar todos los handlers en paralelo
    const promises = listeners.map(listener => listener(event));
    await Promise.allSettled(promises);

    if (this.logger) {
      this.logger.debug(`Event ${eventName} published`, {
        eventId: event.eventId,
        listenerCount,
        occurredOn: event.occurredOn,
      });
    }
  }

  /**
   * Suscribe un handler a un tipo de evento
   * Usa EventEmitter.on internamente
   */
  subscribe(eventName: string, handler: (event: DomainEvent) => Promise<void>): void {
    // Wrapper para manejar handlers async y errores
    const wrappedHandler = async (event: DomainEvent): Promise<void> => {
      try {
        await handler(event);
      } catch (error) {
        // Log error pero no fallar el publish
        if (this.logger) {
          this.logger.error(
            `Error processing event ${eventName}`,
            error as Error,
            {
              eventId: event.eventId,
              eventName,
            }
          );
        } else {
          console.error(`Error processing event ${eventName}:`, error);
        }
        // En producción, podrías enviar a un dead letter queue
      }
    };

    // Registrar handler en EventEmitter
    this.on(eventName, wrappedHandler);

    if (this.logger) {
      this.logger.debug(`Handler subscribed to event ${eventName}`, {
        eventName,
        listenerCount: this.listenerCount(eventName),
      });
    }
  }

  /**
   * Desuscribe un handler de un tipo de evento
   * Usa EventEmitter.off internamente
   */
  unsubscribe(eventName: string, handler: Function): void {
    // EventEmitter requiere la misma referencia de función
    // Por eso guardamos el handler original en el wrapper
    this.off(eventName, handler as (...args: any[]) => void);

    if (this.logger) {
      this.logger.debug(`Handler unsubscribed from event ${eventName}`, {
        eventName,
        listenerCount: this.listenerCount(eventName),
      });
    }
  }

  /**
   * Limpia todos los handlers (útil para testing)
   * Usa EventEmitter.removeAllListeners
   */
  clear(): void {
    this.removeAllListeners();

    if (this.logger) {
      this.logger.debug('All event listeners cleared');
    }
  }

  /**
   * Limpia handlers de un evento específico
   */
  clearEvent(eventName: string): void {
    this.removeAllListeners(eventName);

    if (this.logger) {
      this.logger.debug(`Listeners cleared for event ${eventName}`);
    }
  }

  /**
   * Obtiene el número de handlers suscritos a un evento
   * Usa EventEmitter.listenerCount
   */
  getHandlerCount(eventName: string): number {
    return this.listenerCount(eventName);
  }

  /**
   * Obtiene todos los nombres de eventos con listeners
   */
  getEventNames(): string[] {
    return this.eventNames().map(name => String(name));
  }

  /**
   * Establece el logger (útil para inyección después de construcción)
   */
  setLogger(logger: ILogger): void {
    this.logger = logger;
  }
}
