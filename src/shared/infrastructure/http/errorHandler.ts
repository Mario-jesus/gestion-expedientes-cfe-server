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
    // Log del error
    logger.error('Unhandled error in request', err, {
      path: req.path,
      method: req.method,
      body: req.body,
    });

    const isDevelopment = config.server.isDevelopment;

    // Si es una DomainException, usar su formato
    if (err instanceof DomainException) {
      const response = err.toJSON();
      res.status(err.statusCode).json({
        ...response,
        ...(isDevelopment && {
          stack: err.stack,
        }),
      });
      return;
    }

    // Determinar código de estado para errores genéricos
    const statusCode = (err as any).statusCode || 500;

    // Respuesta de error genérico
    res.status(statusCode).json({
      error: err.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(isDevelopment && {
        stack: err.stack,
        details: (err as any).details,
      }),
    });
  };
}
