import { DomainEvent } from '@shared/domain/entities/DomainEvent';

/**
 * Evento de dominio que se dispara cuando un usuario inicia sesión exitosamente
 */
export class UserLoggedIn extends DomainEvent {
  /**
   * ID del usuario que inició sesión
   */
  public readonly userId: string;

  /**
   * Username del usuario
   */
  public readonly username: string;

  /**
   * IP desde la cual se inició sesión (opcional, para auditoría)
   */
  public readonly ipAddress?: string;

  /**
   * User-Agent del cliente (opcional, para auditoría)
   */
  public readonly userAgent?: string;

  constructor(
    userId: string,
    username: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    super();
    this.userId = userId;
    this.username = username;
    if (ipAddress !== undefined) {
      this.ipAddress = ipAddress;
    }
    if (userAgent !== undefined) {
      this.userAgent = userAgent;
    }
  }

  getEventName(): string {
    return 'auth.user.logged_in';
  }
}
