/**
 * Barrel export para adaptadores de entrada HTTP del módulo auth
 */

export { AuthController } from './AuthController';
export { createAuthRoutes } from './routes';
// Re-exportar tipos y middlewares desde shared para mantener compatibilidad
export { authenticate, authorize } from '@shared/infrastructure';
export type { AuthenticatedRequest, AuthenticatedUser } from '@shared/infrastructure';
