import rateLimit, { RateLimitRequestHandler, ipKeyGenerator } from 'express-rate-limit';
import { ILogger } from '@shared/domain';

/**
 * Configuración para crear un rate limiter
 */
export interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en milisegundos
  maxAttempts: number; // Máximo número de intentos por ventana
  message?: string; // Mensaje personalizado cuando se excede el límite
  skipSuccessfulRequests?: boolean; // Si true, no cuenta requests exitosos
  skipFailedRequests?: boolean; // Si true, no cuenta requests fallidos
}

/**
 * Crea un middleware de rate limiting configurable
 * 
 * Este middleware previene ataques de fuerza bruta limitando el número de requests
 * que un cliente puede hacer en una ventana de tiempo determinada.
 * 
 * El rate limiting se basa en la IP del cliente (req.ip).
 * 
 * Este middleware está en shared porque puede ser usado por cualquier módulo
 * que requiera protección contra abuso de endpoints.
 * 
 * @param config - Configuración del rate limiter
 * @param logger - Logger para registrar eventos de rate limiting
 * @returns Middleware de Express que aplica rate limiting
 * 
 * @example
 * ```typescript
 * const loginLimiter = createRateLimiter(
 *   { windowMs: 900000, maxAttempts: 5 },
 *   logger
 * );
 * router.post('/login', loginLimiter, controller.login);
 * ```
 */
export function createRateLimiter(
  config: RateLimitConfig,
  logger: ILogger
): RateLimitRequestHandler {
  const {
    windowMs,
    maxAttempts,
    message = 'Demasiados intentos desde esta IP, por favor intenta más tarde',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return rateLimit({
    windowMs,
    max: maxAttempts,
    message: {
      error: message,
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true, // Retorna información de rate limit en headers estándar
    legacyHeaders: false, // No usar headers legacy
    skipSuccessfulRequests,
    skipFailedRequests,
    handler: (req, res) => {
      // Obtener IP del request
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      logger.warn('Rate limit excedido', {
        ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('user-agent'),
        windowMs,
        maxAttempts,
      });

      res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000), // Tiempo en segundos hasta el próximo intento
      });
    },
    // Key generator: usar el helper ipKeyGenerator para manejar IPv6 correctamente
    // Este helper previene que usuarios con IPv6 eviten los límites de rate limiting
    // ipKeyGenerator recibe la IP (string) y la normaliza para IPv6
    keyGenerator: (req) => {
      // Obtener IP del request (Express ya maneja X-Forwarded-For si trust proxy está configurado)
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      // Usar ipKeyGenerator para normalizar la IP y manejar IPv6 correctamente
      return ipKeyGenerator(ip);
    },
  });
}
