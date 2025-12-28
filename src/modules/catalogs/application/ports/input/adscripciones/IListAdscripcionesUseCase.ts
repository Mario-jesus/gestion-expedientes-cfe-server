import type { Adscripcion } from '../../../../domain/entities/Adscripcion';
import type { ListAdscripcionesDTO } from '../../../dto/adscripciones/ListAdscripcionesDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de listar adscripciones
 */
export interface IListAdscripcionesUseCase {
  execute(dto: ListAdscripcionesDTO): Promise<{ adscripciones: Adscripcion[]; total: number }>;
}
