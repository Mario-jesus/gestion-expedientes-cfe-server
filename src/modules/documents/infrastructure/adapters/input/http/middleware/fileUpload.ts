import multer from 'multer';
import { Request } from 'express';
import { config } from '@shared/config';
import { ILogger } from '@shared/domain';

/**
 * Configuración de almacenamiento en memoria para Multer
 * Los archivos se cargan en memoria como Buffer
 */
const storage = multer.memoryStorage();

/**
 * Middleware de Multer para validar y procesar uploads de archivos
 * 
 * Configuración:
 * - Almacenamiento en memoria (buffer)
 * - Validación de tamaño máximo
 * - Validación de tipos MIME permitidos
 * 
 * @param logger - Logger para registrar eventos
 * @returns Middleware de Multer configurado
 */
export function createFileUploadMiddleware(logger: ILogger) {
  const maxFileSize = config.fileStorage.maxFileSize;
  const allowedFileTypes = config.fileStorage.allowedFileTypes;

  return multer({
    storage,
    limits: {
      fileSize: maxFileSize,
    },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      // Validar tipo MIME
      if (allowedFileTypes.includes(file.mimetype)) {
        logger.debug('Archivo validado', {
          fileName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });
        cb(null, true);
      } else {
        logger.warn('Intento de subir archivo con tipo no permitido', {
          fileName: file.originalname,
          mimetype: file.mimetype,
          allowedTypes: allowedFileTypes,
        });
        cb(
          new Error(
            `Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: ${allowedFileTypes.join(', ')}`
          )
        );
      }
    },
  });
}

/**
 * Middleware específico para subir un solo archivo con el campo 'file'
 */
export function singleFileUpload(logger: ILogger) {
  return createFileUploadMiddleware(logger).single('file');
}
