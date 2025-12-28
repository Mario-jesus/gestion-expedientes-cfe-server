/**
 * Value Object para CURP (Clave Única de Registro de Población)
 * Encapsula la validación y comportamiento del CURP
 * 
 * Características:
 * - Inmutable
 * - Validación de formato (18 caracteres alfanuméricos)
 * - Normalización (trim, uppercase)
 */
export class CURP {
  private readonly _value: string;

  constructor(curp: string) {
    const trimmedCURP = curp?.trim() || '';

    if (!trimmedCURP) {
      throw new Error('El CURP es requerido');
    }

    // Normalizar: convertir a uppercase
    const normalizedCURP = trimmedCURP.toUpperCase();

    // Validar formato: exactamente 18 caracteres alfanuméricos
    // Formato: AAMMDDHHSSNNNSXX
    // Permite guiones y espacios (se eliminan para validación)
    const cleanedCURP = normalizedCURP.replace(/[-\s]/g, '');

    if (cleanedCURP.length !== 18) {
      throw new Error('El CURP debe tener exactamente 18 caracteres alfanuméricos');
    }

    // Validar que solo contenga letras y números
    if (!/^[A-Z0-9]+$/.test(cleanedCURP)) {
      throw new Error('El CURP solo puede contener letras y números');
    }

    this._value = cleanedCURP;
  }

  /**
   * Obtiene el valor del CURP como string
   */
  get value(): string {
    return this._value;
  }

  /**
   * Obtiene el valor del CURP (alias de value)
   */
  toString(): string {
    return this._value;
  }

  /**
   * Compara dos objetos CURP por valor
   */
  equals(other: CURP | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof CURP)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Crea una instancia de CURP desde un string (factory method)
   */
  static create(curp: string): CURP {
    return new CURP(curp);
  }

  /**
   * Crea una instancia de CURP desde persistencia (sin validación adicional)
   */
  static fromPersistence(curp: string): CURP {
    return new CURP(curp);
  }
}
