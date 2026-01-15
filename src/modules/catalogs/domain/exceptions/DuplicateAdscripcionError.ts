import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando se intenta crear una adscripción
 * con un valor de adscripción que ya existe
 */
export class DuplicateAdscripcionError extends DomainException {
  constructor(adscripcion: string) {
    super(
      `Ya existe una adscripción con el valor '${adscripcion}'`,
      409, // Conflict
      'DUPLICATE_ADSCRIPCION',
      'adscripcion', // Campo que causó el error
      { adscripcion } // Detalles adicionales
    );
  }
}
