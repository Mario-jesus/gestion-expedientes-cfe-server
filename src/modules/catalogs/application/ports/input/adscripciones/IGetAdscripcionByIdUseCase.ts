import type { Adscripcion } from '../../../../domain/entities/Adscripcion';

/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener adscripción por ID
 */
export interface IGetAdscripcionByIdUseCase {
  execute(id: string): Promise<Adscripcion>;
}
