import { UserRole } from '../../domain/enums/UserRole';

/**
 * DTO para crear un nuevo usuario
 * Representa los datos que vienen del request HTTP
 */
export interface CreateUserDTO {
  username: string;
  email: string;
  password: string; // Contraseña en texto plano
  name: string;
  role: UserRole;
  isActive?: boolean; // Default: true
}
