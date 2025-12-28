/**
 * Value Object para tokens JWT
 * Encapsula la validación y manipulación de tokens JWT
 */
export class JwtToken {
  private constructor(private readonly value: string) {}

  /**
   * Factory method para crear un JwtToken
   * @param token - String del token JWT
   * @returns Instancia de JwtToken
   * @throws Error si el token está vacío
   */
  static create(token: string): JwtToken {
    if (!token || token.trim().length === 0) {
      throw new Error('Token cannot be empty');
    }

    // Validar formato básico de JWT (tres partes separadas por puntos)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format: token must have three parts separated by dots');
    }

    return new JwtToken(token);
  }

  /**
   * Factory method para crear un JwtToken desde persistencia
   * Asume que el token ya fue validado previamente
   */
  static fromPersistence(token: string): JwtToken {
    return new JwtToken(token);
  }

  /**
   * Obtiene el valor del token como string
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Obtiene el valor del token (alias de getValue)
   */
  toString(): string {
    return this.value;
  }

  /**
   * Compara si dos tokens son iguales
   */
  equals(other: JwtToken): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Verifica si el token está vacío
   */
  isEmpty(): boolean {
    return this.value.trim().length === 0;
  }
}
