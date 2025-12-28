import { Entity } from '@shared/domain/entities/Entity';

/**
 * Propiedades requeridas para crear un RefreshToken
 */
export interface RefreshTokenProps {
  token: string; // El token JWT como string
  userId: string; // ID del usuario propietario del token
  expiresAt: Date; // Fecha de expiración del token
  isRevoked?: boolean; // Si el token ha sido revocado (logout)
}

/**
 * Entidad de dominio RefreshToken
 * Representa un refresh token almacenado en el sistema
 * 
 * Los refresh tokens se usan para renovar access tokens sin requerir
 * que el usuario vuelva a iniciar sesión.
 */
export class RefreshToken extends Entity<RefreshTokenProps> {
  private constructor(props: RefreshTokenProps, id: string, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.props = props;
  }

  private props: RefreshTokenProps;

  /**
   * Factory method para crear una nueva instancia de RefreshToken
   */
  public static create(props: RefreshTokenProps, id?: string): RefreshToken {
    const tokenId = id || crypto.randomUUID();

    // Validar que el token no esté vacío
    if (!props.token || props.token.trim().length === 0) {
      throw new Error('Token cannot be empty');
    }

    // Validar que el userId no esté vacío
    if (!props.userId || props.userId.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }

    // Validar que expiresAt sea una fecha futura
    if (props.expiresAt <= new Date()) {
      throw new Error('ExpiresAt must be a future date');
    }

    const refreshToken = new RefreshToken(
      {
        token: props.token,
        userId: props.userId,
        expiresAt: props.expiresAt,
        isRevoked: props.isRevoked ?? false,
      },
      tokenId
    );

    return refreshToken;
  }

  /**
   * Factory method para reconstruir un RefreshToken desde persistencia
   */
  public static fromPersistence(
    props: RefreshTokenProps,
    id: string,
    createdAt: Date,
    updatedAt: Date
  ): RefreshToken {
    return new RefreshToken(props, id, createdAt, updatedAt);
  }

  // Getters
  get token(): string {
    return this.props.token;
  }

  get userId(): string {
    return this.props.userId;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get isRevoked(): boolean {
    return this.props.isRevoked ?? false;
  }

  /**
   * Verifica si el token está expirado
   */
  isExpired(): boolean {
    return new Date() >= this.props.expiresAt;
  }

  /**
   * Verifica si el token es válido (no expirado y no revocado)
   */
  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked;
  }

  /**
   * Revoca el token (marca como revocado)
   * Usado cuando el usuario hace logout
   */
  revoke(): void {
    if (this.props.isRevoked) {
      return; // Ya está revocado
    }
    this.props.isRevoked = true;
    this.markAsUpdated();
  }

  /**
   * Obtiene las propiedades del token (para persistencia)
   */
  toPersistence(): {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    isRevoked: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      token: this.props.token,
      userId: this.props.userId,
      expiresAt: this.props.expiresAt,
      isRevoked: this.props.isRevoked ?? false,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
