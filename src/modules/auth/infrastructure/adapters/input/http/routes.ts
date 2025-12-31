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

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Iniciar sesión
   *     description: Autentica un usuario y retorna tokens JWT (access token y refresh token)
   *     tags: [Autenticación]
   *     security: []  # Endpoint público, no requiere autenticación
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: Nombre de usuario
   *                 example: admin
   *               password:
   *                 type: string
   *                 format: password
   *                 description: Contraseña del usuario
   *                 example: admin123
   *     responses:
   *       200:
   *         description: Login exitoso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                   description: Access token JWT
   *                 refreshToken:
   *                   type: string
   *                   description: Refresh token para renovar el access token
   *                 expiresIn:
   *                   type: number
   *                   description: Tiempo de expiración en segundos
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     username:
   *                       type: string
   *                     name:
   *                       type: string
   *                     email:
   *                       type: string
   *                     role:
   *                       type: string
   *                       enum: [admin, operator]
   *                     isActive:
   *                       type: boolean
   *       401:
   *         description: Credenciales inválidas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Cuenta desactivada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       429:
   *         description: Demasiados intentos de login
   */
  // POST /auth/login - Iniciar sesión (público) con rate limiting
  if (loginRateLimiter) {
    router.post('/login', loginRateLimiter, controller.login.bind(controller));
  } else {
    router.post('/login', controller.login.bind(controller));
  }

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Refrescar access token
   *     description: Refresca el access token usando un refresh token válido. Implementa rotación de tokens (el refresh token usado se invalida y se genera uno nuevo). Retorna tanto el nuevo access token como el nuevo refresh token.
   *     tags: [Autenticación]
   *     security: []  # Endpoint público, no requiere autenticación
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 description: Refresh token JWT válido
   *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *     responses:
   *       200:
   *         description: Token refrescado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                   description: Nuevo access token JWT
   *                 refreshToken:
   *                   type: string
   *                   description: Nuevo refresh token (el anterior se invalida)
   *                 expiresIn:
   *                   type: number
   *                   description: Tiempo de expiración en segundos
   *       400:
   *         description: Refresh token no proporcionado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: refreshToken es requerido
   *                 code:
   *                   type: string
   *                   example: MISSING_REFRESH_TOKEN
   *       401:
   *         description: Refresh token inválido o expirado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Cuenta desactivada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       429:
   *         description: Demasiados intentos de refresh
   */
  // POST /auth/refresh - Refrescar access token (público) con rate limiting
  if (refreshRateLimiter) {
    router.post('/refresh', refreshRateLimiter, controller.refresh.bind(controller));
  } else {
    router.post('/refresh', controller.refresh.bind(controller));
  }

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Obtener información del usuario autenticado
   *     description: Retorna la información del usuario actual basado en el token JWT
   *     tags: [Autenticación]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Información del usuario
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 username:
   *                   type: string
   *                 name:
   *                   type: string
   *                 email:
   *                   type: string
   *                 role:
   *                   type: string
   *                   enum: [admin, operator]
   *                 isActive:
   *                   type: boolean
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *       401:
   *         description: No autenticado o token inválido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // GET /auth/me - Obtener información del usuario autenticado (requiere autenticación)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get('/me', authenticate(tokenVerifier, logger) as any, controller.me.bind(controller) as any);

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Cerrar sesión
   *     description: Cierra la sesión del usuario autenticado. Opcionalmente invalida un refresh token específico si se proporciona en el body.
   *     tags: [Autenticación]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 description: Refresh token a invalidar (opcional)
   *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *     responses:
   *       200:
   *         description: Logout exitoso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Logout exitoso
   *       401:
   *         description: No autenticado o token inválido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // POST /auth/logout - Cerrar sesión (requiere autenticación)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/logout', authenticate(tokenVerifier, logger) as any, controller.logout.bind(controller) as any);

  return router;
}
