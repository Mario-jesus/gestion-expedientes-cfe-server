import { Request, Response, NextFunction } from 'express';
import { ILogger } from '../../domain/ILogger';
import { config } from '../config';

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

    // Determinar código de estado
    const statusCode = (err as any).statusCode || 500;
    const isDevelopment = config.server.isDevelopment;

    // Respuesta de error
    res.status(statusCode).json({
      error: err.message || 'Internal server error',
      ...(isDevelopment && {
        stack: err.stack,
        details: (err as any).details,
      }),
    });
  };
}
