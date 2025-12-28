import { AuthResponseDTO } from '../../dto/AuthResponseDTO';
import { LoginDTO } from '../../dto/LoginDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de login
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface ILoginUseCase {
  /**
   * Inicia sesión de un usuario en el sistema
   * @param dto - DTO con username y password
   * @param ipAddress - IP del cliente (opcional, para auditoría)
   * @param userAgent - User-Agent del cliente (opcional, para auditoría)
   * @returns Respuesta de autenticación con tokens y datos del usuario
   * @throws InvalidCredentialsError si las credenciales son inválidas
   * @throws UserInactiveError si el usuario está inactivo
   */
  execute(
    dto: LoginDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponseDTO>;
}
