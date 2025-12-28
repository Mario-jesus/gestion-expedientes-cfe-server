/**
 * Interfaz que representa un archivo subido
 * Compatible con Express.Multer.File pero sin depender de multer en el dominio
 */
export interface UploadedFile {
  buffer?: Buffer;
  path?: string;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * Interfaz del servicio de almacenamiento de archivos
 * Define el contrato para guardar, obtener y eliminar archivos físicos
 * 
 * Este es un Output Port (Driven Port) - el dominio define lo que necesita
 * Las implementaciones pueden ser: LocalFileStorageService, S3FileStorageService, etc.
 */
export interface IFileStorageService {
  /**
   * Guarda un archivo y retorna la URL/path donde se guardó
   * @param file - Buffer del archivo o archivo subido (compatible con Multer)
   * @param fileName - Nombre del archivo (debe ser único)
   * @param folder - Carpeta donde guardar (ej: 'documents', 'minutes')
   * @returns Objeto con fileUrl (ruta relativa) y fileName
   */
  saveFile(
    file: Buffer | UploadedFile,
    fileName: string,
    folder?: string
  ): Promise<{ fileUrl: string; fileName: string }>;

  /**
   * Obtiene la URL completa para acceder al archivo
   * @param filePath - Ruta relativa o absoluta del archivo
   * @returns URL completa para acceso (ej: /uploads/documents/file.pdf)
   */
  getFileUrl(filePath: string): string;

  /**
   * Elimina un archivo del almacenamiento
   * @param filePath - Ruta del archivo a eliminar
   * @throws Error si el archivo no existe o no se puede eliminar
   */
  deleteFile(filePath: string): Promise<void>;

  /**
   * Verifica si un archivo existe
   * @param filePath - Ruta del archivo a verificar
   * @returns true si existe, false si no existe
   */
  fileExists(filePath: string): Promise<boolean>;
}
