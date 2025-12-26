/**
 * Value Object para Username
 * Encapsula la validación y comportamiento del nombre de usuario
 * 
 * Características:
 * - Inmutable
 * - Validación de formato (alfanumérico + guiones/underscores)
 * - Longitud mínima y máxima
 * - Normalización (trim)
 */
export class Username {
  private readonly _value: string;

  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 50;
  private static readonly VALID_PATTERN = /^[a-zA-Z0-9_-]+$/;

  constructor(username: string) {
    const trimmedUsername = username?.trim() || '';

    if (!trimmedUsername) {
      throw new Error('El username es requerido');
    }

    if (trimmedUsername.length < Username.MIN_LENGTH) {
      throw new Error(`El username debe tener al menos ${Username.MIN_LENGTH} caracteres`);
    }

    if (trimmedUsername.length > Username.MAX_LENGTH) {
      throw new Error(`El username no puede tener más de ${Username.MAX_LENGTH} caracteres`);
    }

    if (!Username.VALID_PATTERN.test(trimmedUsername)) {
      throw new Error('El username solo puede contener letras, números, guiones y guiones bajos');
    }

    this._value = trimmedUsername;
  }

  /**
   * Obtiene el valor del username como string
   */
  get value(): string {
    return this._value;
  }

  /**
   * Obtiene el valor del username (alias de value)
   */
  toString(): string {
    return this._value;
  }

  /**
   * Compara dos objetos Username por valor
   */
  equals(other: Username | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof Username)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Crea una instancia de Username desde un string (factory method)
   */
  static create(username: string): Username {
    return new Username(username);
  }

  /**
   * Crea una instancia de Username desde persistencia (sin validación adicional)
   */
  static fromPersistence(username: string): Username {
    return new Username(username);
  }
}
