/**
 * DTO para actualizar el perfil propio de un usuario
 * Solo permite actualizar nombre y email (no username, role, isActive)
 */
export interface UpdateProfileDTO {
  name?: string;
  email?: string;
}
