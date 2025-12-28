import { Router } from 'express';
import { AuthController } from './AuthController';
import { authenticate, createRateLimiter, config } from '@shared/infrastructure';
import { ITokenVerifier } from '@shared/infrastructure/http/middleware/types';
import { ILogger } from '@shared/domain';

/**
 * Configura las rutas HTTP para el módulo de autenticación
 * 
 * @param controller - Instancia del AuthController con casos de uso inyectados
 * @param tokenVerifier - Verificador de tokens (ITokenVerifier) para el middleware de autenticación
 * @param logger - Logger para el middleware de autenticación
 * @returns Router configurado con todas las rutas de autenticación
 */
export function createAuthRoutes(
  controller: AuthController,
  tokenVerifier: ITokenVerifier,
  logger: ILogger
): Router {
  const router = Router();

  // Crear rate limiters para login y refresh
  const loginRateLimiter = config.security.rateLimit
    ? createRateLimiter(
        {
          windowMs: config.security.rateLimit.login.windowMs,
          maxAttempts: config.security.rateLimit.login.maxAttempts,
          message: 'Demasiados intentos de inicio de sesión. Por favor intenta más tarde.',
          skipSuccessfulRequests: true, // No contar logins exitosos
        },
        logger
      )
    : undefined;

  const refreshRateLimiter = config.security.rateLimit
    ? createRateLimiter(
        {
          windowMs: config.security.rateLimit.refresh.windowMs,
          maxAttempts: config.security.rateLimit.refresh.maxAttempts,
          message: 'Demasiados intentos de refrescar token. Por favor intenta más tarde.',
          skipSuccessfulRequests: true, // No contar refreshes exitosos
        },
        logger
      )
    : undefined;

  // POST /auth/login - Iniciar sesión (público) con rate limiting
  if (loginRateLimiter) {
    router.post('/login', loginRateLimiter, controller.login.bind(controller));
  } else {
    router.post('/login', controller.login.bind(controller));
  }

  // POST /auth/refresh - Refrescar access token (público) con rate limiting
  if (refreshRateLimiter) {
    router.post('/refresh', refreshRateLimiter, controller.refresh.bind(controller));
  } else {
    router.post('/refresh', controller.refresh.bind(controller));
  }

  // GET /auth/me - Obtener información del usuario autenticado (requiere autenticación)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/me', authenticate(tokenVerifier, logger) as any, controller.me.bind(controller) as any);

  // POST /auth/logout - Cerrar sesión (requiere autenticación)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/logout', authenticate(tokenVerifier, logger) as any, controller.logout.bind(controller) as any);

  return router;
}
