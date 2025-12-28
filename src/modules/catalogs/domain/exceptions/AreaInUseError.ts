import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando se intenta eliminar un área
 * que tiene colaboradores o adscripciones asociadas
 */
export class AreaInUseError extends DomainException {
  constructor(areaId: string, reason: 'collaborators' | 'adscripciones' | 'both') {
    const messages = {
      collaborators: 'No se puede eliminar el área porque tiene colaboradores asociados',
      adscripciones: 'No se puede eliminar el área porque tiene adscripciones activas asociadas',
      both: 'No se puede eliminar el área porque tiene colaboradores y adscripciones activas asociadas',
    };

    super(
      messages[reason],
      400, // Bad Request
      'AREA_IN_USE',
      undefined, // No hay campo específico
      { areaId, reason } // Detalles adicionales
    );
  }
}
