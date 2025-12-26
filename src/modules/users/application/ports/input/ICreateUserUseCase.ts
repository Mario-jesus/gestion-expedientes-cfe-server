import { User } from '../../../domain/entities/User';
import { CreateUserDTO } from '../../dto/CreateUserDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de crear usuario
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface ICreateUserUseCase {
  /**
   * Crea un nuevo usuario en el sistema
   * @param dto - DTO con los datos del usuario a crear
   * @param createdBy - ID del usuario que está creando este usuario (opcional, para audit)
   * @returns El usuario creado
   * @throws DuplicateUserError si el username o email ya existe
   * @note El parámetro createdBy también se usa como performedBy en el evento UserCreated
   */
  execute(dto: CreateUserDTO, createdBy?: string): Promise<User>;
}
