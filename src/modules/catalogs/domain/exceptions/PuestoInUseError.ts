import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando se intenta eliminar un puesto
 * que tiene colaboradores asociados
 */
export class PuestoInUseError extends DomainException {
  constructor(puestoId: string) {
    super(
      'No se puede eliminar el puesto porque tiene colaboradores asociados',
      400, // Bad Request
      'PUESTO_IN_USE',
      undefined, // No hay campo específico
      { puestoId } // Detalles adicionales
    );
  }
}
