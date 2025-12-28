import type { Adscripcion } from '../../../../domain/entities/Adscripcion';
import { CreateAdscripcionDTO } from '../../../dto/adscripciones/CreateAdscripcionDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de crear adscripción
 */
export interface ICreateAdscripcionUseCase {
  execute(dto: CreateAdscripcionDTO, createdBy?: string): Promise<Adscripcion>;
}
