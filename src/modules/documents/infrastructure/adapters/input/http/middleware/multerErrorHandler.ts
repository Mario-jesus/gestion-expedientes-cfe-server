import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para manejar errores de Multer
 * 
 * Convierte errores de Multer (tipo de archivo no permitido, tamaño excedido, etc.)
 * a respuestas HTTP apropiadas (400 Bad Request)
 * 
 * Este middleware debe usarse DESPUÉS del middleware de Multer
 * y ANTES del controller para capturar errores de validación de archivos
 */
export function handleMulterError(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err) {
    // Error de Multer (tipo de archivo no permitido, tamaño excedido, etc.)
    if (err.message && err.message.includes('Tipo de archivo no permitido')) {
      res.status(400).json({
        error: err.message,
        code: 'INVALID_FILE_TYPE',
        field: 'file',
      });
      return;
    }

    // Error de tamaño de archivo
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: 'El archivo excede el tamaño máximo permitido',
        code: 'FILE_SIZE_EXCEEDED',
        field: 'file',
      });
      return;
    }

    // Otros errores de Multer
    next(err);
    return;
  }

  next();
}
