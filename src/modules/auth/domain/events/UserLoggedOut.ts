import { DomainEvent } from '@shared/domain/entities/DomainEvent';

/**
 * Evento de dominio que se dispara cuando un usuario cierra sesión
 */
export class UserLoggedOut extends DomainEvent {
  /**
   * ID del usuario que cerró sesión
   */
  public readonly userId: string;

  /**
   * Username del usuario
   */
  public readonly username: string;

  /**
   * ID del refresh token que fue revocado (opcional)
   */
  public readonly refreshTokenId?: string;

  /**
   * Si se revocaron todos los tokens del usuario
   */
  public readonly revokedAllTokens: boolean;

  constructor(
    userId: string,
    username: string,
    revokedAllTokens: boolean = false,
    refreshTokenId?: string
  ) {
    super();
    this.userId = userId;
    this.username = username;
    this.revokedAllTokens = revokedAllTokens;
    if (refreshTokenId !== undefined) {
      this.refreshTokenId = refreshTokenId;
    }
  }

  getEventName(): string {
    return 'auth.user.logged_out';
  }
}
