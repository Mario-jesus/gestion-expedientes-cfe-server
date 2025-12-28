import type { Adscripcion } from '../../../../domain/entities/Adscripcion';
import type { UpdateAdscripcionDTO } from '../../../dto/adscripciones/UpdateAdscripcionDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de actualizar adscripción
 */
export interface IUpdateAdscripcionUseCase {
  execute(adscripcionId: string, dto: UpdateAdscripcionDTO, performedBy?: string): Promise<Adscripcion>;
}
