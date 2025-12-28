import { DomainEvent } from '@shared/domain/entities/DomainEvent';

/**
 * Evento de dominio que se dispara cuando se detecta un intento de reutilizar
 * un refresh token que ya fue usado (revocado por rotación).
 * 
 * Este evento indica una posible brecha de seguridad:
 * - Alguien podría estar intentando reutilizar un token robado que ya fue usado
 * - Con rotación de tokens, cada refresh token solo puede usarse una vez
 * - Si se intenta usar un token ya revocado, es una señal de ataque
 * 
 * Este evento debe ser manejado para:
 * - Registrar el incidente de seguridad
 * - Revocar todos los tokens del usuario (por seguridad)
 * - Notificar al usuario (si es posible)
 * - Realizar auditoría de seguridad
 */
export class RefreshTokenReuseDetected extends DomainEvent {
  /**
   * ID del usuario cuyo token se intentó reutilizar
   */
  public readonly userId: string;

  /**
   * ID del refresh token que se intentó reutilizar
   */
  public readonly refreshTokenId: string;

  /**
   * Valor del token que se intentó reutilizar (parcial, para auditoría)
   * Solo se guarda una parte del token por seguridad
   */
  public readonly tokenPreview: string;

  /**
   * IP desde la cual se intentó reutilizar el token (opcional, para auditoría)
   */
  public readonly ipAddress?: string;

  /**
   * User-Agent del cliente (opcional, para auditoría)
   */
  public readonly userAgent?: string;

  /**
   * Fecha en que el token fue originalmente usado (cuando se revocó)
   */
  public readonly tokenRevokedAt: Date;

  /**
   * Si todos los tokens del usuario fueron revocados como resultado
   */
  public readonly allTokensRevoked: boolean;

  constructor(
    userId: string,
    refreshTokenId: string,
    tokenPreview: string,
    tokenRevokedAt: Date,
    allTokensRevoked: boolean = true,
    ipAddress?: string,
    userAgent?: string
  ) {
    super();
    this.userId = userId;
    this.refreshTokenId = refreshTokenId;
    this.tokenPreview = tokenPreview;
    this.tokenRevokedAt = tokenRevokedAt;
    this.allTokensRevoked = allTokensRevoked;
    if (ipAddress !== undefined) {
      this.ipAddress = ipAddress;
    }
    if (userAgent !== undefined) {
      this.userAgent = userAgent;
    }
  }

  getEventName(): string {
    return 'auth.security.refresh_token_reuse_detected';
  }
}
