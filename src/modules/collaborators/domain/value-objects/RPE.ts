/**
 * Value Object para RPE (Registro de Personal de Empleados)
 * Encapsula la validación y comportamiento del RPE
 * 
 * Características:
 * - Inmutable
 * - Validación de formato
 * - Normalización (trim, uppercase)
 */
export class RPE {
  private readonly _value: string;

  constructor(rpe: string) {
    const trimmedRPE = rpe?.trim() || '';

    if (!trimmedRPE) {
      throw new Error('El RPE es requerido');
    }

    // Normalizar: convertir a uppercase para consistencia
    const normalizedRPE = trimmedRPE.toUpperCase();

    // Validar formato básico (alfanumérico, permitir guiones)
    // RPE puede tener diferentes formatos, por lo que solo validamos que no esté vacío
    // y tenga una longitud razonable (ej: hasta 20 caracteres)
    if (normalizedRPE.length > 20) {
      throw new Error('El RPE no puede tener más de 20 caracteres');
    }

    this._value = normalizedRPE;
  }

  /**
   * Obtiene el valor del RPE como string
   */
  get value(): string {
    return this._value;
  }

  /**
   * Obtiene el valor del RPE (alias de value)
   */
  toString(): string {
    return this._value;
  }

  /**
   * Compara dos objetos RPE por valor
   */
  equals(other: RPE | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof RPE)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Crea una instancia de RPE desde un string (factory method)
   */
  static create(rpe: string): RPE {
    return new RPE(rpe);
  }

  /**
   * Crea una instancia de RPE desde persistencia (sin validación adicional)
   */
  static fromPersistence(rpe: string): RPE {
    return new RPE(rpe);
  }
}
