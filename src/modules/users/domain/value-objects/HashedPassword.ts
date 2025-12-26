/**
 * Value Object para HashedPassword
 * Encapsula una contraseña hasheada (ya encriptada)
 * 
 * Nota: Este value object solo almacena el hash, NO realiza el hash.
 * El hash debe realizarse en la capa de aplicación (usando bcrypt).
 * 
 * Características:
 * - Inmutable
 * - Validación de que no esté vacío
 * - Protección: nunca expone la contraseña en texto plano
 */
export class HashedPassword {
  private readonly _value: string;

  constructor(hashedPassword: string) {
    const trimmedHash = hashedPassword?.trim() || '';

    if (!trimmedHash) {
      throw new Error('La contraseña hasheada es requerida');
    }

    // Validar que parezca un hash (generalmente los hashes de bcrypt tienen un formato específico)
    // Un hash de bcrypt típicamente tiene 60 caracteres y empieza con $2a$, $2b$, o $2y$
    if (trimmedHash.length < 10) {
      throw new Error('La contraseña hasheada no tiene un formato válido');
    }

    this._value = trimmedHash;
  }

  /**
   * Obtiene el valor del hash como string
   */
  get value(): string {
    return this._value;
  }

  /**
   * Obtiene el valor del hash (alias de value)
   */
  toString(): string {
    return this._value;
  }

  /**
   * Compara dos objetos HashedPassword por valor
   */
  equals(other: HashedPassword | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof HashedPassword)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Crea una instancia de HashedPassword desde un string (factory method)
   */
  static create(hashedPassword: string): HashedPassword {
    return new HashedPassword(hashedPassword);
  }

  /**
   * Crea una instancia de HashedPassword desde persistencia (sin validación adicional)
   */
  static fromPersistence(hashedPassword: string): HashedPassword {
    return new HashedPassword(hashedPassword);
  }
}
