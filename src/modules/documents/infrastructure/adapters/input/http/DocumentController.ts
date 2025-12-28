import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@shared/domain';
import { AuthenticatedRequest } from '@shared/infrastructure';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';
import {
  ICreateDocumentUseCase,
  IGetDocumentByIdUseCase,
  IListDocumentsUseCase,
  IUpdateDocumentUseCase,
  IDeleteDocumentUseCase,
  IGetDocumentDownloadUrlUseCase,
} from '@modules/documents/application/ports/input';
import {
  CreateDocumentDTO,
  UpdateDocumentDTO,
  ListDocumentsFiltersDTO,
} from '@modules/documents/application/dto';
import { UploadedFile } from '@modules/documents/domain/ports/output/IFileStorageService';

/**
 * Controller HTTP para la gestión de documentos
 * 
 * Este controller actúa como adaptador de entrada (Input Adapter) que convierte
 * requests HTTP en llamadas a casos de uso de la capa de aplicación.
 * 
 * Responsabilidades:
 * - Recibir requests HTTP (incluyendo multipart/form-data para uploads)
 * - Validar y mapear datos del request a DTOs
 * - Convertir archivos de Multer a UploadedFile
 * - Llamar a los casos de uso correspondientes
 * - Formatear respuestas HTTP
 * - Manejar errores (delegados al errorHandler de Express)
 */
export class DocumentController {
  constructor(
    private readonly createDocumentUseCase: ICreateDocumentUseCase,
    private readonly getDocumentByIdUseCase: IGetDocumentByIdUseCase,
    private readonly listDocumentsUseCase: IListDocumentsUseCase,
    private readonly updateDocumentUseCase: IUpdateDocumentUseCase,
    private readonly deleteDocumentUseCase: IDeleteDocumentUseCase,
    private readonly getDocumentDownloadUrlUseCase: IGetDocumentDownloadUrlUseCase,
    private readonly logger: ILogger
  ) {}

  /**
   * Obtiene el ID del usuario autenticado desde el request
   */
  private getCurrentUserId(req: Request | AuthenticatedRequest): string | undefined {
    if ('user' in req && req.user) {
      return req.user.id;
    }
    return undefined;
  }

  /**
   * Convierte un archivo de Multer a UploadedFile
   */
  private multerFileToUploadedFile(file: Express.Multer.File): UploadedFile {
    return {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  /**
   * POST /documents
   * Crea un nuevo documento (con upload de archivo)
   * Requiere autenticación
   * Content-Type: multipart/form-data
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const uploadedBy = this.getCurrentUserId(req);
      if (!uploadedBy) {
        res.status(401).json({
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      // Validar que hay un archivo
      if (!req.file) {
        res.status(400).json({
          error: 'Archivo requerido',
          code: 'FILE_REQUIRED',
          field: 'file',
        });
        return;
      }

      // Validar kind
      const kind = req.body.kind as string;
      if (!kind || !Object.values(DocumentKind).includes(kind as DocumentKind)) {
        res.status(400).json({
          error: `kind debe ser uno de: ${Object.values(DocumentKind).join(', ')}`,
          code: 'INVALID_KIND',
          field: 'kind',
        });
        return;
      }

      // Validar collaboratorId
      const collaboratorId = req.body.collaboratorId as string;
      if (!collaboratorId) {
        res.status(400).json({
          error: 'collaboratorId es requerido',
          code: 'COLLABORATOR_ID_REQUIRED',
          field: 'collaboratorId',
        });
        return;
      }

      // Construir DTO
      const dto: CreateDocumentDTO = {
        collaboratorId,
        kind: kind as DocumentKind,
        periodo: req.body.periodo || undefined,
        descripcion: req.body.descripcion || undefined,
        documentTypeId: req.body.documentTypeId || undefined,
      };

      // Convertir archivo de Multer a UploadedFile
      const uploadedFile = this.multerFileToUploadedFile(req.file);

      this.logger.info('Creando documento', {
        collaboratorId: dto.collaboratorId,
        kind: dto.kind,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadedBy,
        ip: req.ip,
      });

      const document = await this.createDocumentUseCase.execute(dto, uploadedFile, uploadedBy);

      this.logger.info('Documento creado exitosamente', {
        documentId: document.id,
        collaboratorId: document.collaboratorId,
        kind: document.kind,
        fileName: document.fileName,
      });

      res.status(201).json(document.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /documents
   * Lista documentos con filtros y paginación
   * Requiere autenticación
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const sortBy = req.query.sortBy as 'createdAt' | 'uploadedAt' | 'fileName' | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      // Validar kind si está presente
      let kind: DocumentKind | undefined;
      if (req.query.kind) {
        const kindStr = req.query.kind as string;
        if (Object.values(DocumentKind).includes(kindStr as DocumentKind)) {
          kind = kindStr as DocumentKind;
        }
      }

      const dto: ListDocumentsFiltersDTO = {
        ...(req.query.collaboratorId && { collaboratorId: req.query.collaboratorId as string }),
        ...(kind && { kind }),
        ...(req.query.isActive !== undefined && {
          isActive: req.query.isActive === 'true',
        }),
        ...(req.query.documentTypeId && { documentTypeId: req.query.documentTypeId as string }),
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      };

      const result = await this.listDocumentsUseCase.execute(dto);

      res.status(200).json({
        data: result.documents.map((document) => document.toPublicJSON()),
        pagination: {
          total: result.total,
          limit: dto.limit ?? 20,
          offset: dto.offset ?? 0,
          totalPages: Math.ceil(result.total / (dto.limit ?? 20)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /documents/:id
   * Obtiene un documento por su ID
   * Requiere autenticación
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const document = await this.getDocumentByIdUseCase.execute(id);

      res.status(200).json(document.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /documents/:id
   * Actualiza un documento (actualización completa de metadatos)
   * Requiere autenticación
   * Nota: No se puede cambiar el archivo, solo metadatos
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updatedBy = this.getCurrentUserId(req);

      const dto: UpdateDocumentDTO = {
        periodo: req.body.periodo,
        descripcion: req.body.descripcion,
        documentTypeId: req.body.documentTypeId,
        isActive: req.body.isActive,
      };

      const document = await this.updateDocumentUseCase.execute(id, dto, updatedBy);

      res.status(200).json(document.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /documents/:id
   * Actualiza parcialmente un documento (misma lógica que PUT)
   * Requiere autenticación
   */
  async partialUpdate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updatedBy = this.getCurrentUserId(req);

      const dto: UpdateDocumentDTO = {
        ...(req.body.periodo !== undefined && { periodo: req.body.periodo }),
        ...(req.body.descripcion !== undefined && { descripcion: req.body.descripcion }),
        ...(req.body.documentTypeId !== undefined && { documentTypeId: req.body.documentTypeId }),
        ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
      };

      const document = await this.updateDocumentUseCase.execute(id, dto, updatedBy);

      res.status(200).json(document.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /documents/:id
   * Elimina un documento (baja lógica)
   * Requiere autenticación
   */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const deletedBy = this.getCurrentUserId(req);

      await this.deleteDocumentUseCase.execute(id, deletedBy);

      res.status(200).json({
        message: 'Documento eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /documents/:id/download
   * Obtiene la URL para descargar/visualizar un documento
   * Requiere autenticación
   */
  async getDownloadUrl(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const viewedBy = this.getCurrentUserId(req);

      const result = await this.getDocumentDownloadUrlUseCase.execute(id, viewedBy);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
