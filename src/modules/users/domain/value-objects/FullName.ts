/**
 * Value Object para FullName (nombre completo del usuario)
 * Encapsula la validación y comportamiento del nombre del usuario
 * 
 * Características:
 * - Inmutable
 * - Validación de longitud mínima y máxima
 * - Normalización (trim)
 */
export class FullName {
  private readonly _value: string;

  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 200;

  constructor(name: string) {
    const trimmedName = name?.trim() || '';

    if (!trimmedName) {
      throw new Error('El nombre es requerido');
    }

    if (trimmedName.length < FullName.MIN_LENGTH) {
      throw new Error(`El nombre debe tener al menos ${FullName.MIN_LENGTH} caracteres`);
    }

    if (trimmedName.length > FullName.MAX_LENGTH) {
      throw new Error(`El nombre no puede tener más de ${FullName.MAX_LENGTH} caracteres`);
    }

    this._value = trimmedName;
  }

  /**
   * Obtiene el valor del nombre como string
   */
  get value(): string {
    return this._value;
  }

  /**
   * Obtiene el valor del nombre (alias de value)
   */
  toString(): string {
    return this._value;
  }

  /**
   * Compara dos objetos FullName por valor
   */
  equals(other: FullName | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof FullName)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Crea una instancia de FullName desde un string (factory method)
   */
  static create(name: string): FullName {
    return new FullName(name);
  }

  /**
   * Crea una instancia de FullName desde persistencia (sin validación adicional)
   */
  static fromPersistence(name: string): FullName {
    return new FullName(name);
  }
}
