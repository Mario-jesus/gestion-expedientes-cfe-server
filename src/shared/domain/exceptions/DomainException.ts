/**
 * Clase base para todas las excepciones de dominio
 * 
 * Proporciona funcionalidad común para manejo de errores:
 * - Código HTTP de estado
 * - Código de error interno
 * - Campo opcional (para errores de validación)
 * - Detalles adicionales
 * 
 * Sigue el patrón de Domain-Driven Design para excepciones de dominio
 */
export abstract class DomainException extends Error {
  /**
   * Código de estado HTTP apropiado para esta excepción
   */
  public readonly statusCode: number;

  /**
   * Código de error interno (útil para frontend para manejo específico)
   */
  public readonly code: string;

  /**
   * Campo específico que causó el error (opcional, para errores de validación)
   */
  public readonly field?: string | undefined;

  /**
   * Detalles adicionales del error (opcional)
   */
  public readonly details?: Record<string, unknown> | undefined;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    field?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    this.details = details;

    // Mantener el stack trace correcto (útil para debugging)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convierte la excepción a un formato JSON para respuestas HTTP
   */
  toJSON(): {
    error: string;
    code: string;
    field?: string | undefined;
    details?: Record<string, unknown> | undefined;
  } {
    const result: {
      error: string;
      code: string;
      field?: string | undefined;
      details?: Record<string, unknown> | undefined;
    } = {
      error: this.message,
      code: this.code,
    };

    if (this.field !== undefined) {
      result.field = this.field;
    }

    if (this.details !== undefined) {
      result.details = this.details;
    }

    return result;
  }
}
