import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@shared/domain';
import { AuthenticatedRequest } from '@shared/infrastructure';
import { MinuteType } from '@modules/minutes/domain/enums/MinuteType';
import {
  ICreateMinuteUseCase,
  IGetMinuteByIdUseCase,
  IListMinutesUseCase,
  IUpdateMinuteUseCase,
  IDeleteMinuteUseCase,
  IGetMinuteDownloadUrlUseCase,
} from '@modules/minutes/application/ports/input';
import {
  CreateMinuteDTO,
  UpdateMinuteDTO,
  ListMinutesFiltersDTO,
} from '@modules/minutes/application/dto';
import { UploadedFile } from '@modules/documents/domain/ports/output/IFileStorageService';

/**
 * Controller HTTP para la gestión de minutas
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
export class MinuteController {
  constructor(
    private readonly createMinuteUseCase: ICreateMinuteUseCase,
    private readonly getMinuteByIdUseCase: IGetMinuteByIdUseCase,
    private readonly listMinutesUseCase: IListMinutesUseCase,
    private readonly updateMinuteUseCase: IUpdateMinuteUseCase,
    private readonly deleteMinuteUseCase: IDeleteMinuteUseCase,
    private readonly getMinuteDownloadUrlUseCase: IGetMinuteDownloadUrlUseCase,
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
   * POST /minutes
   * Crea una nueva minuta (con upload de archivo)
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

      // Validar tipo
      const tipo = req.body.tipo as string;
      if (!tipo || !Object.values(MinuteType).includes(tipo as MinuteType)) {
        res.status(400).json({
          error: `tipo debe ser uno de: ${Object.values(MinuteType).join(', ')}`,
          code: 'INVALID_TIPO',
          field: 'tipo',
        });
        return;
      }

      // Validar título
      const titulo = req.body.titulo as string;
      if (!titulo || titulo.trim().length === 0) {
        res.status(400).json({
          error: 'titulo es requerido',
          code: 'TITULO_REQUIRED',
          field: 'titulo',
        });
        return;
      }

      // Validar fecha
      const fechaStr = req.body.fecha as string;
      if (!fechaStr) {
        res.status(400).json({
          error: 'fecha es requerida',
          code: 'FECHA_REQUIRED',
          field: 'fecha',
        });
        return;
      }

      // Convertir fecha string a Date
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) {
        res.status(400).json({
          error: 'fecha debe ser una fecha válida (ISO string)',
          code: 'INVALID_FECHA',
          field: 'fecha',
        });
        return;
      }

      // Construir DTO
      const dto: CreateMinuteDTO = {
        titulo: titulo.trim(),
        tipo: tipo as MinuteType,
        descripcion: req.body.descripcion || undefined,
        fecha,
      };

      // Convertir archivo de Multer a UploadedFile
      const uploadedFile = this.multerFileToUploadedFile(req.file);

      this.logger.info('Creando minuta', {
        titulo: dto.titulo,
        tipo: dto.tipo,
        fecha: dto.fecha,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadedBy,
        ip: req.ip,
      });

      const minute = await this.createMinuteUseCase.execute(dto, uploadedFile, uploadedBy);

      this.logger.info('Minuta creada exitosamente', {
        minuteId: minute.id,
        titulo: minute.titulo,
        tipo: minute.tipo,
        fileName: minute.fileName,
      });

      res.status(201).json(minute.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /minutes
   * Lista minutas con filtros y paginación
   * Requiere autenticación
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const sortBy = req.query.sortBy as 'createdAt' | 'fecha' | 'titulo' | 'uploadedAt' | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      // Validar tipo si está presente
      let tipo: MinuteType | undefined;
      if (req.query.tipo) {
        const tipoStr = req.query.tipo as string;
        if (Object.values(MinuteType).includes(tipoStr as MinuteType)) {
          tipo = tipoStr as MinuteType;
        }
      }

      // Convertir fechas si están presentes
      let fechaDesde: Date | string | undefined;
      if (req.query.fechaDesde) {
        fechaDesde = req.query.fechaDesde as string;
      }

      let fechaHasta: Date | string | undefined;
      if (req.query.fechaHasta) {
        fechaHasta = req.query.fechaHasta as string;
      }

      const dto: ListMinutesFiltersDTO = {
        ...(tipo && { tipo }),
        ...(req.query.isActive !== undefined && {
          isActive: req.query.isActive === 'true',
        }),
        ...(fechaDesde && { fechaDesde }),
        ...(fechaHasta && { fechaHasta }),
        ...(req.query.search && { search: req.query.search as string }),
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      };

      const result = await this.listMinutesUseCase.execute(dto);

      res.status(200).json({
        data: result.minutes.map((minute) => minute.toPublicJSON()),
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
   * GET /minutes/:id
   * Obtiene una minuta por su ID
   * Requiere autenticación
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const minute = await this.getMinuteByIdUseCase.execute(id);

      res.status(200).json(minute.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /minutes/:id
   * Actualiza una minuta (actualización completa de metadatos)
   * Requiere autenticación
   * Nota: No se puede cambiar el archivo, solo metadatos
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updatedBy = this.getCurrentUserId(req);

      // Convertir fecha si está presente
      let fecha: Date | undefined;
      if (req.body.fecha) {
        const fechaValue = req.body.fecha instanceof Date ? req.body.fecha : new Date(req.body.fecha);
        if (isNaN(fechaValue.getTime())) {
          res.status(400).json({
            error: 'fecha debe ser una fecha válida (ISO string)',
            code: 'INVALID_FECHA',
            field: 'fecha',
          });
          return;
        }
        fecha = fechaValue;
      }

      const dto: UpdateMinuteDTO = {
        ...(req.body.titulo !== undefined && { titulo: req.body.titulo }),
        ...(req.body.tipo !== undefined && { tipo: req.body.tipo }),
        ...(req.body.descripcion !== undefined && { descripcion: req.body.descripcion }),
        ...(fecha !== undefined && { fecha }),
        ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
      };

      const minute = await this.updateMinuteUseCase.execute(id, dto, updatedBy);

      res.status(200).json(minute.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /minutes/:id
   * Actualiza parcialmente una minuta (misma lógica que PUT)
   * Requiere autenticación
   */
  async partialUpdate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updatedBy = this.getCurrentUserId(req);

      // Convertir fecha si está presente
      let fecha: Date | undefined;
      if (req.body.fecha !== undefined) {
        const fechaValue = req.body.fecha instanceof Date ? req.body.fecha : new Date(req.body.fecha);
        if (isNaN(fechaValue.getTime())) {
          res.status(400).json({
            error: 'fecha debe ser una fecha válida (ISO string)',
            code: 'INVALID_FECHA',
            field: 'fecha',
          });
          return;
        }
        fecha = fechaValue;
      }

      const dto: UpdateMinuteDTO = {
        ...(req.body.titulo !== undefined && { titulo: req.body.titulo }),
        ...(req.body.tipo !== undefined && { tipo: req.body.tipo }),
        ...(req.body.descripcion !== undefined && { descripcion: req.body.descripcion }),
        ...(fecha !== undefined && { fecha }),
        ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
      };

      const minute = await this.updateMinuteUseCase.execute(id, dto, updatedBy);

      res.status(200).json(minute.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /minutes/:id
   * Elimina una minuta (baja lógica)
   * Requiere autenticación
   */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const deletedBy = this.getCurrentUserId(req);

      await this.deleteMinuteUseCase.execute(id, deletedBy);

      res.status(200).json({
        message: 'Minuta eliminada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /minutes/:id/download
   * Obtiene la URL para descargar/visualizar una minuta
   * Requiere autenticación
   */
  async getDownloadUrl(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const viewedBy = this.getCurrentUserId(req);

      const result = await this.getMinuteDownloadUrlUseCase.execute(id, viewedBy);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
