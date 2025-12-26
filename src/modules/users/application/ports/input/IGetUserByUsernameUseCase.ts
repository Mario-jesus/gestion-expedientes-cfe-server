import { User } from '../../../domain/entities/User';
import { GetUserByUsernameDTO } from '../../dto/GetUserByUsernameDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener usuario por username
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface IGetUserByUsernameUseCase {
  /**
   * Obtiene un usuario por su username
   * @param dto - DTO con el username a buscar
   * @returns El usuario encontrado o null si no existe
   */
  execute(dto: GetUserByUsernameDTO): Promise<User | null>;
}
