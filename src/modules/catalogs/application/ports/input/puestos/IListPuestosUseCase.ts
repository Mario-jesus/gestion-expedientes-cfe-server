import type { Puesto } from '../../../../domain/entities/Puesto';
import type { ListPuestosDTO } from '../../../dto/puestos/ListPuestosDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de listar puestos
 */
export interface IListPuestosUseCase {
  execute(dto: ListPuestosDTO): Promise<{ puestos: Puesto[]; total: number }>;
}
