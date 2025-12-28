import { DomainEvent } from '@shared/domain/entities/DomainEvent';

/**
 * Evento de dominio que se dispara cuando se detecta un intento de usar
 * un refresh token expirado.
 * 
 * Este evento indica una posible brecha de seguridad:
 * - Alguien podría estar intentando usar un token robado que ya expiró
 * - Se requiere acción inmediata: revocar todos los tokens del usuario
 * 
 * Este evento debe ser manejado para:
 * - Registrar el incidente de seguridad
 * - Notificar al usuario (si es posible)
 * - Realizar auditoría de seguridad
 */
export class ExpiredRefreshTokenAttemptDetected extends DomainEvent {
  /**
   * ID del usuario cuyo token expirado se intentó usar
   */
  public readonly userId: string;

  /**
   * ID del refresh token que se intentó usar (si está disponible)
   */
  public readonly refreshTokenId?: string;

  /**
   * Valor del token que se intentó usar (parcial, para auditoría)
   * Solo se guarda una parte del token por seguridad
   */
  public readonly tokenPreview: string;

  /**
   * IP desde la cual se intentó usar el token (opcional, para auditoría)
   */
  public readonly ipAddress?: string;

  /**
   * User-Agent del cliente (opcional, para auditoría)
   */
  public readonly userAgent?: string;

  /**
   * Fecha de expiración del token que se intentó usar
   */
  public readonly tokenExpiredAt: Date;

  /**
   * Si todos los tokens del usuario fueron revocados como resultado
   */
  public readonly allTokensRevoked: boolean;

  constructor(
    userId: string,
    tokenExpiredAt: Date,
    tokenPreview: string,
    allTokensRevoked: boolean = true,
    refreshTokenId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    super();
    this.userId = userId;
    this.tokenExpiredAt = tokenExpiredAt;
    this.tokenPreview = tokenPreview;
    this.allTokensRevoked = allTokensRevoked;
    if (refreshTokenId !== undefined) {
      this.refreshTokenId = refreshTokenId;
    }
    if (ipAddress !== undefined) {
      this.ipAddress = ipAddress;
    }
    if (userAgent !== undefined) {
      this.userAgent = userAgent;
    }
  }

  getEventName(): string {
    return 'auth.security.expired_refresh_token_attempt';
  }
}
