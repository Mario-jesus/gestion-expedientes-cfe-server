import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando se intenta crear un puesto con un nombre que ya existe
 */
export class DuplicatePuestoError extends DomainException {
  constructor(nombre: string) {
    super(
      `Ya existe un puesto con el nombre: ${nombre}`,
      409, // Conflict
      'DUPLICATE_PUESTO',
      'nombre', // Campo que causó el error
      { nombre } // Detalles adicionales
    );
  }
}
