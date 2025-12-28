/**
 * Value Object para RFC (Registro Federal de Contribuyentes)
 * Encapsula la validación y comportamiento del RFC
 * 
 * Características:
 * - Inmutable
 * - Validación de formato (12-13 caracteres alfanuméricos)
 * - Normalización (trim, uppercase)
 */
export class RFC {
  private readonly _value: string;

  constructor(rfc: string) {
    const trimmedRFC = rfc?.trim() || '';

    if (!trimmedRFC) {
      throw new Error('El RFC es requerido');
    }

    // Normalizar: convertir a uppercase
    const normalizedRFC = trimmedRFC.toUpperCase();

    // Validar formato: 12-13 caracteres alfanuméricos
    // Personas físicas: 13 caracteres (AAMMDDNNNXXX)
    // Personas morales: 12 caracteres (AAMMDDNNNXX)
    // Permite guiones y espacios (se eliminan para validación)
    const cleanedRFC = normalizedRFC.replace(/[-\s]/g, '');

    if (cleanedRFC.length < 12 || cleanedRFC.length > 13) {
      throw new Error('El RFC debe tener entre 12 y 13 caracteres alfanuméricos');
    }

    // Validar que solo contenga letras y números
    if (!/^[A-Z0-9]+$/.test(cleanedRFC)) {
      throw new Error('El RFC solo puede contener letras y números');
    }

    this._value = cleanedRFC;
  }

  /**
   * Obtiene el valor del RFC como string
   */
  get value(): string {
    return this._value;
  }

  /**
   * Obtiene el valor del RFC (alias de value)
   */
  toString(): string {
    return this._value;
  }

  /**
   * Compara dos objetos RFC por valor
   */
  equals(other: RFC | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof RFC)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Crea una instancia de RFC desde un string (factory method)
   */
  static create(rfc: string): RFC {
    return new RFC(rfc);
  }

  /**
   * Crea una instancia de RFC desde persistencia (sin validación adicional)
   */
  static fromPersistence(rfc: string): RFC {
    return new RFC(rfc);
  }
}
