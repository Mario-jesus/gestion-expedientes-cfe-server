/**
 * DTO para iniciar sesión
 * Representa los datos que vienen del request HTTP
 */
export interface LoginDTO {
  username: string;
  password: string; // Contraseña en texto plano
}
