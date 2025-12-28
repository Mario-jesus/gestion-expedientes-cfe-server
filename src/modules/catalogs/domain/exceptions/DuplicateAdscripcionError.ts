import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando se intenta crear una adscripción
 * con un nombre que ya existe en el área especificada
 */
export class DuplicateAdscripcionError extends DomainException {
  constructor(nombre: string, areaId: string) {
    super(
      `Ya existe una adscripción con el nombre '${nombre}' en el área especificada`,
      409, // Conflict
      'DUPLICATE_ADSCRIPCION',
      'nombre', // Campo que causó el error
      { nombre, areaId } // Detalles adicionales
    );
  }
}
