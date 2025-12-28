/**
 * DTO de respuesta de autenticación
 * Representa los datos que se retornan después de un login exitoso
 */
export interface AuthResponseDTO {
  token: string; // Access token JWT
  refreshToken: string; // Refresh token JWT
  expiresIn: number; // Tiempo de expiración en segundos
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}
