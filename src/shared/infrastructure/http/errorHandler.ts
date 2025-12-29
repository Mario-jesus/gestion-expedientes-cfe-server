import { Request, Response, NextFunction } from 'express';
import { ILogger } from '../../domain/ports/output/ILogger';
import { config } from '../../config';

/**
 * Middleware global para manejo de errores
 * Captura todos los errores y los formatea apropiadamente
 */
import { DomainException } from '../../domain/exceptions/DomainException';

/**
 * Middleware global para manejo de errores
 * Captura todos los errores y los formatea apropiadamente
 */
export function errorHandler(logger: ILogger) {
  return (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    // Log del error (incluyendo stack trace para logs internos)
    logger.error('Unhandled error in request', err, {
      path: req.path,
      method: req.method,
      body: req.body,
    });

    // Verificación estricta: NUNCA enviar stack trace en producción
    // Doble verificación para mayor seguridad
    const isDevelopment = config.server.isDevelopment && config.server.nodeEnv === 'development';
    const isProduction = config.server.isProduction || config.server.nodeEnv === 'production';

    // Si es una DomainException, usar su formato
    if (err instanceof DomainException) {
      const response = err.toJSON();

      // Solo incluir stack trace si estamos en desarrollo Y no en producción
      const responseBody: any = { ...response };

      if (isDevelopment && !isProduction) {
        responseBody.stack = err.stack;
      }

      res.status(err.statusCode).json(responseBody);
      return;
    }

    // Determinar código de estado para errores genéricos
    const statusCode = (err as any).statusCode || 500;

    // Respuesta de error genérico
    // En producción, nunca exponer detalles internos o stack traces
    const responseBody: any = {
      error: isProduction 
        ? 'Error interno del servidor' // Mensaje genérico en producción
        : (err.message || 'Internal server error'),
      code: 'INTERNAL_ERROR',
    };

    // Solo incluir stack trace y detalles si estamos en desarrollo Y no en producción
    if (isDevelopment && !isProduction) {
      responseBody.stack = err.stack;
      if ((err as any).details) {
        responseBody.details = (err as any).details;
      }
    }

    res.status(statusCode).json(responseBody);
  };
}
