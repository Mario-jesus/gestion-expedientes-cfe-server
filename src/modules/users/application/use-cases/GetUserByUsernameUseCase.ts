import { ILogger } from '@shared/domain';
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/ports/output/IUserRepository';
import { IGetUserByUsernameUseCase } from '../ports/input/IGetUserByUsernameUseCase';
import { GetUserByUsernameDTO } from '../dto/GetUserByUsernameDTO';

/**
 * Caso de uso para obtener un usuario por su username
 * 
 * Este caso de uso es utilizado principalmente en el flujo de autenticación
 * para buscar un usuario por su username antes de validar la contraseña
 */
export class GetUserByUsernameUseCase implements IGetUserByUsernameUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con el username a buscar
   * @returns El usuario encontrado o null si no existe
   */
  async execute(dto: GetUserByUsernameDTO): Promise<User | null> {
    this.logger.debug('Ejecutando caso de uso: Obtener usuario por username', {
      username: dto.username,
    });

    const user = await this.userRepository.findByUsername(dto.username);

    if (!user) {
      this.logger.debug('Usuario no encontrado por username', {
        username: dto.username,
      });
    } else {
      this.logger.debug('Usuario encontrado por username', {
        username: dto.username,
        userId: user.id,
      });
    }

    return user;
  }
}
