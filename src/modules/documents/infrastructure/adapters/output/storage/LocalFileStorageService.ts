import * as fs from 'fs/promises';
import * as path from 'path';
import { IFileStorageService, UploadedFile } from '@modules/documents/domain/ports/output/IFileStorageService';
import { ILogger } from '@shared/domain';
import { config } from '@shared/config';

/**
 * Implementación del servicio de almacenamiento de archivos usando el sistema de archivos local
 * 
 * Este adaptador:
 * - Guarda archivos en el sistema de archivos local
 * - Organiza archivos por carpeta (documents, minutes)
 * - Genera URLs absolutas para acceso
 * - Maneja errores de I/O y los convierte a excepciones apropiadas
 */
export class LocalFileStorageService implements IFileStorageService {
  private readonly baseDir: string;
  private readonly documentsDir: string;
  private readonly minutesDir: string;

  constructor(private readonly logger: ILogger) {
    // Obtener directorios desde la configuración
    this.baseDir = path.resolve(config.fileStorage.uploadDir);
    this.documentsDir = path.resolve(config.fileStorage.documentsDir);
    this.minutesDir = path.resolve(config.fileStorage.minutesDir);

    // Asegurar que los directorios existan al inicializar
    this.ensureDirectoriesExist().catch((error) => {
      this.logger.error('Error creando directorios de almacenamiento', error);
      throw error;
    });
  }

  /**
   * Asegura que todos los directorios necesarios existan
   */
  private async ensureDirectoriesExist(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      await fs.mkdir(this.documentsDir, { recursive: true });
      await fs.mkdir(this.minutesDir, { recursive: true });

      this.logger.debug('Directorios de almacenamiento verificados', {
        baseDir: this.baseDir,
        documentsDir: this.documentsDir,
        minutesDir: this.minutesDir,
      });
    } catch (error) {
      this.logger.error('Error creando directorios de almacenamiento', error instanceof Error ? error : new Error(String(error)), {
        baseDir: this.baseDir,
        documentsDir: this.documentsDir,
        minutesDir: this.minutesDir,
      });
      throw error;
    }
  }

  /**
   * Obtiene el directorio de destino según la carpeta especificada
   */
  private getTargetDirectory(folder?: string): string {
    switch (folder) {
      case 'documents':
        return this.documentsDir;
      case 'minutes':
        return this.minutesDir;
      default:
        // Si no se especifica carpeta, usar el directorio base
        return this.baseDir;
    }
  }

  /**
   * Sanitiza el nombre del archivo para evitar path traversal y caracteres peligrosos
   */
  private sanitizeFileName(fileName: string): string {
    // Remover caracteres peligrosos y path traversal
    let sanitized = fileName
      .replace(/\.\./g, '') // Remover ..
      .replace(/\//g, '_') // Reemplazar / con _
      .replace(/\\/g, '_') // Reemplazar \ con _
      .replace(/[<>:"|?*]/g, '_'); // Reemplazar caracteres no permitidos

    // Limitar longitud
    if (sanitized.length > 255) {
      const ext = path.extname(sanitized);
      const nameWithoutExt = path.basename(sanitized, ext);
      sanitized = nameWithoutExt.substring(0, 255 - ext.length) + ext;
    }

    return sanitized;
  }

  /**
   * Guarda un archivo y retorna la URL/path donde se guardó
   */
  async saveFile(
    file: Buffer | UploadedFile,
    fileName: string,
    folder?: string
  ): Promise<{ fileUrl: string; fileName: string }> {
    try {
      // Sanitizar el nombre del archivo
      const sanitizedFileName = this.sanitizeFileName(fileName);

      // Obtener directorio de destino
      const targetDir = this.getTargetDirectory(folder);

      // Asegurar que el directorio existe
      await fs.mkdir(targetDir, { recursive: true });

      // Ruta completa del archivo
      const filePath = path.join(targetDir, sanitizedFileName);

      // Obtener el buffer del archivo
      let fileBuffer: Buffer;
      if (Buffer.isBuffer(file)) {
        fileBuffer = file;
      } else {
        // Si es UploadedFile, obtener el buffer
        if (file.buffer) {
          fileBuffer = file.buffer;
        } else if (file.path) {
          // Si tiene path, leer el archivo desde el sistema de archivos
          fileBuffer = await fs.readFile(file.path);
        } else {
          throw new Error('No se puede obtener el contenido del archivo: falta buffer o path');
        }
      }

      // Guardar el archivo
      await fs.writeFile(filePath, fileBuffer);

      // Generar URL relativa para acceso
      // La URL será relativa al directorio base de uploads
      const relativePath = path.relative(this.baseDir, filePath);
      const fileUrl = `/${relativePath.replace(/\\/g, '/')}`; // Normalizar separadores para URLs

      this.logger.info('Archivo guardado exitosamente', {
        fileName: sanitizedFileName,
        filePath,
        fileUrl,
        fileSize: fileBuffer.length,
        folder,
      });

      return { fileUrl, fileName: sanitizedFileName };
    } catch (error) {
      this.logger.error('Error guardando archivo', error instanceof Error ? error : new Error(String(error)), {
        fileName,
        folder,
      });
      throw error;
    }
  }

  /**
   * Obtiene la URL completa para acceder al archivo
   * Retorna una URL absoluta que incluye el host y puerto del servidor
   */
  getFileUrl(filePath: string): string {
    let relativePath: string;

    // Normalizar la ruta a una ruta relativa que empiece con /uploads
    if (filePath.startsWith('/')) {
      // Si ya empieza con /, verificar si incluye /uploads
      if (filePath.startsWith('/uploads/')) {
        relativePath = filePath;
      } else {
        // Si no incluye /uploads, agregarlo
        // Ejemplo: /minutes/file.png -> /uploads/minutes/file.png
        relativePath = `/uploads${filePath}`;
      }
    } else if (path.isAbsolute(filePath)) {
      // Si es una ruta absoluta, convertirla a relativa desde baseDir
      const relativeFromBase = path.relative(this.baseDir, filePath);
      relativePath = `/uploads/${relativeFromBase.replace(/\\/g, '/')}`;
    } else {
      // Si es una ruta relativa, asegurar que empiece con /uploads
      relativePath = filePath.startsWith('/uploads/') 
        ? filePath 
        : `/uploads/${filePath.startsWith('/') ? filePath.slice(1) : filePath}`;
    }

    // Construir URL absoluta usando la configuración del servidor
    const baseUrl = config.server.baseUrl;
    const port = config.server.port;

    // Si baseUrl ya incluye el puerto o es una URL completa, usarla directamente
    // Si no, agregar el puerto (excepto para puertos estándar 80/443)
    let fullUrl: string;
    if (baseUrl.includes('://')) {
      // Ya es una URL completa (http:// o https://)
      const url = new URL(baseUrl);
      // Solo agregar puerto si no es el puerto estándar para el protocolo
      if (port && port !== 80 && port !== 443) {
        url.port = port.toString();
      }
      fullUrl = `${url.origin}${relativePath}`;
    } else {
      // Es solo un hostname, construir URL completa
      const protocol = port === 443 ? 'https' : 'http';
      const portPart = (port && port !== 80 && port !== 443) ? `:${port}` : '';
      fullUrl = `${protocol}://${baseUrl}${portPart}${relativePath}`;
    }

    return fullUrl;
  }

  /**
   * Elimina un archivo del almacenamiento
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      // Convertir URL relativa a ruta absoluta si es necesario
      const absolutePath = this.getAbsolutePath(filePath);

      // Verificar que el archivo existe antes de intentar eliminarlo
      try {
        await fs.access(absolutePath);
      } catch {
        // Si el archivo no existe, no es un error crítico
        this.logger.warn('Intento de eliminar archivo que no existe', {
          filePath,
          absolutePath,
        });
        return; // Salir silenciosamente
      }

      // Eliminar el archivo
      await fs.unlink(absolutePath);

      this.logger.info('Archivo eliminado exitosamente', {
        filePath,
        absolutePath,
      });
    } catch (error) {
      this.logger.error('Error eliminando archivo', error instanceof Error ? error : new Error(String(error)), {
        filePath,
      });
      throw error;
    }
  }

  /**
   * Verifica si un archivo existe
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const absolutePath = this.getAbsolutePath(filePath);
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convierte una ruta relativa o absoluta a ruta absoluta
   */
  private getAbsolutePath(filePath: string): string {
    // Si ya es absoluta, retornarla
    if (path.isAbsolute(filePath)) {
      return filePath;
    }

    // Si es una URL relativa (empieza con /), remover el / y construir ruta absoluta
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    return path.join(this.baseDir, cleanPath);
  }
}
