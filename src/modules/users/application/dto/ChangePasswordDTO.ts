/**
 * DTO para cambiar la contraseña de un usuario
 */
export interface ChangePasswordDTO {
  currentPassword: string; // Contraseña actual (para validación)
  newPassword: string; // Nueva contraseña en texto plano
}
