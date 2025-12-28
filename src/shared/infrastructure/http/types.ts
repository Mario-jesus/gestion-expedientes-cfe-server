import { Request } from 'express';

/**
 * Información del usuario autenticado que se adjunta al request
 * Este tipo es compartido entre módulos que requieren autenticación
 */
export interface AuthenticatedUser {
  id: string;
  username: string;
  role: string;
}

/**
 * Extensión del tipo Request de Express para incluir información del usuario autenticado
 * Este tipo se usa después de que el middleware authenticate procesa el token JWT
 * 
 * Este tipo está en shared porque puede ser usado por cualquier módulo que requiera autenticación
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
