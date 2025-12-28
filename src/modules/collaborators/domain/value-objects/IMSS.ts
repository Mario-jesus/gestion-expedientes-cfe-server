/**
 * Value Object para IMSS (Número del Instituto Mexicano del Seguro Social)
 * Encapsula la validación y comportamiento del número de IMSS
 * 
 * Características:
 * - Inmutable
 * - Validación de formato (11 dígitos)
 * - Normalización (trim, solo números)
 */
export class IMSS {
  private readonly _value: string;

  constructor(imss: string) {
    const trimmedIMSS = imss?.trim() || '';

    if (!trimmedIMSS) {
      throw new Error('El número de IMSS es requerido');
    }

    // Normalizar: eliminar guiones y espacios, solo números
    const cleanedIMSS = trimmedIMSS.replace(/[-\s]/g, '');

    // Validar formato: exactamente 11 dígitos
    if (cleanedIMSS.length !== 11) {
      throw new Error('El número de IMSS debe tener exactamente 11 dígitos');
    }

    // Validar que solo contenga números
    if (!/^\d+$/.test(cleanedIMSS)) {
      throw new Error('El número de IMSS solo puede contener dígitos');
    }

    this._value = cleanedIMSS;
  }

  /**
   * Obtiene el valor del IMSS como string
   */
  get value(): string {
    return this._value;
  }

  /**
   * Obtiene el valor del IMSS (alias de value)
   */
  toString(): string {
    return this._value;
  }

  /**
   * Compara dos objetos IMSS por valor
   */
  equals(other: IMSS | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof IMSS)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Crea una instancia de IMSS desde un string (factory method)
   */
  static create(imss: string): IMSS {
    return new IMSS(imss);
  }

  /**
   * Crea una instancia de IMSS desde persistencia (sin validación adicional)
   */
  static fromPersistence(imss: string): IMSS {
    return new IMSS(imss);
  }
}
