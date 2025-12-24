import { Request, Response } from 'express';

/**
 * Middleware para manejar rutas no encontradas (404)
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
}
