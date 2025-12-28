import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando se intenta eliminar una adscripción
 * que tiene colaboradores asociados
 */
export class AdscripcionInUseError extends DomainException {
  constructor(adscripcionId: string) {
    super(
      'No se puede eliminar la adscripción porque tiene colaboradores asociados',
      400, // Bad Request
      'ADSCRIPCION_IN_USE',
      undefined, // No hay campo específico
      { adscripcionId } // Detalles adicionales
    );
  }
}
