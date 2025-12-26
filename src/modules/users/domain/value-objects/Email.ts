/**
 * Value Object para Email
 * Encapsula la validación y comportamiento del email del usuario
 * 
 * Características:
 * - Inmutable
 * - Validación de formato
 * - Normalización (lowercase, trim)
 */
export class Email {
  private readonly _value: string;

  constructor(email: string) {
    const trimmedEmail = email?.trim() || '';

    if (!trimmedEmail) {
      throw new Error('El email es requerido');
    }

    if (!Email.isValid(trimmedEmail)) {
      throw new Error('El email no tiene un formato válido');
    }

    // Normalizar: convertir a lowercase
    this._value = trimmedEmail.toLowerCase();
  }

  /**
   * Valida el formato del email
   */
  private static isValid(email: string): boolean {
    // Regex básico para validar formato de email
    // Permite la mayoría de formatos válidos de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validaciones adicionales
    if (email.length > 255) {
      return false; // Longitud máxima del email
    }

    return emailRegex.test(email);
  }

  /**
   * Obtiene el valor del email como string
   */
  get value(): string {
    return this._value;
  }

  /**
   * Obtiene el valor del email (alias de value)
   */
  toString(): string {
    return this._value;
  }

  /**
   * Compara dos objetos Email por valor
   */
  equals(other: Email | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof Email)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Crea una instancia de Email desde un string (factory method)
   */
  static create(email: string): Email {
    return new Email(email);
  }

  /**
   * Crea una instancia de Email desde persistencia (sin validación adicional)
   */
  static fromPersistence(email: string): Email {
    return new Email(email);
  }
}
