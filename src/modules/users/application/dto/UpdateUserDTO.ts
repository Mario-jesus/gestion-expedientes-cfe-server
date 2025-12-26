import { UserRole } from '../../domain/enums/UserRole';

/**
 * DTO para actualizar un usuario existente
 * Todos los campos son opcionales (actualización parcial)
 */
export interface UpdateUserDTO {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}
