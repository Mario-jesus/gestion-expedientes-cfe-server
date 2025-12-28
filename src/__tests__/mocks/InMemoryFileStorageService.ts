/**
 * Mock de FileStorageService para tests
 * Implementa IFileStorageService usando almacenamiento en memoria
 * 
 * Este mock permite ejecutar tests E2E sin necesidad de escribir archivos en el sistema de archivos
 */

import { IFileStorageService, UploadedFile } from '@modules/documents/domain/ports/output/IFileStorageService';
import { ILogger } from '@shared/domain';

interface StoredFile {
  buffer: Buffer;
  fileName: string;
  fileUrl: string;
  folder?: string | undefined;
}

export class InMemoryFileStorageService implements IFileStorageService {
  private files: Map<string, StoredFile> = new Map(); // fileUrl -> StoredFile

  constructor(private readonly logger: ILogger) {}

  async saveFile(
    file: Buffer | UploadedFile,
    fileName: string,
    folder?: string
  ): Promise<{ fileUrl: string; fileName: string }> {
    // Obtener el buffer del archivo
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else {
      if (file.buffer) {
        fileBuffer = file.buffer;
      } else if (file.path) {
        // En un mock, no podemos leer del sistema de archivos
        // Simulamos un buffer vacío
        fileBuffer = Buffer.from('');
        this.logger.warn('InMemoryFileStorageService: file.path no soportado, usando buffer vacío', {
          fileName,
          path: file.path,
        });
      } else {
        fileBuffer = Buffer.from('');
      }
    }

    // Generar fileUrl (simulando estructura de carpetas)
    const fileUrl = folder ? `/${folder}/${fileName}` : `/${fileName}`;

    // Guardar archivo en memoria
    const storedFile: StoredFile = {
      buffer: fileBuffer,
      fileName,
      fileUrl,
      ...(folder !== undefined && { folder }),
    };
    this.files.set(fileUrl, storedFile);

    this.logger.debug('Archivo guardado en memoria', {
      fileName,
      fileUrl,
      folder,
      size: fileBuffer.length,
    });

    return { fileUrl, fileName };
  }

  getFileUrl(filePath: string): string {
    // Si ya es una URL relativa (empieza con /), retornarla
    if (filePath.startsWith('/')) {
      return filePath;
    }

    // Si no empieza con /, agregarlo
    return `/${filePath}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    const fileUrl = this.getFileUrl(filePath);
    const deleted = this.files.delete(fileUrl);

    if (deleted) {
      this.logger.debug('Archivo eliminado de memoria', {
        fileUrl,
      });
    } else {
      this.logger.warn('Intento de eliminar archivo que no existe en memoria', {
        fileUrl,
      });
      // No lanzamos error para mantener compatibilidad con LocalFileStorageService
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    const fileUrl = this.getFileUrl(filePath);
    return this.files.has(fileUrl);
  }

  /**
   * Obtiene el contenido de un archivo (útil para tests)
   */
  getFileContent(fileUrl: string): Buffer | null {
    const file = this.files.get(fileUrl);
    return file ? file.buffer : null;
  }

  /**
   * Limpia todos los archivos (útil para tests)
   */
  clear(): void {
    this.files.clear();
  }

  /**
   * Obtiene todos los archivos guardados (útil para tests)
   */
  getAllFiles(): StoredFile[] {
    return Array.from(this.files.values());
  }
}
