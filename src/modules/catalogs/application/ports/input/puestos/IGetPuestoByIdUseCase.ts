import type { Puesto } from '../../../../domain/entities/Puesto';

/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener puesto por ID
 */
export interface IGetPuestoByIdUseCase {
  execute(id: string): Promise<Puesto>;
}
