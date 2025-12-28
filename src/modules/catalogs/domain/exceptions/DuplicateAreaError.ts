import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando se intenta crear un área con un nombre que ya existe
 */
export class DuplicateAreaError extends DomainException {
  constructor(nombre: string) {
    super(
      `Ya existe un área con el nombre: ${nombre}`,
      409, // Conflict
      'DUPLICATE_AREA',
      'nombre', // Campo que causó el error
      { nombre } // Detalles adicionales
    );
  }
}
