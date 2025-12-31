import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@shared/domain';
import { AuthenticatedRequest } from '@shared/infrastructure';
import { ICreateDocumentTypeUseCase } from '@modules/catalogs/application/ports/input/documentTypes/ICreateDocumentTypeUseCase';
import { IGetDocumentTypeByIdUseCase } from '@modules/catalogs/application/ports/input/documentTypes/IGetDocumentTypeByIdUseCase';
import { IListDocumentTypesUseCase } from '@modules/catalogs/application/ports/input/documentTypes/IListDocumentTypesUseCase';
import { IUpdateDocumentTypeUseCase } from '@modules/catalogs/application/ports/input/documentTypes/IUpdateDocumentTypeUseCase';
import { IDeleteDocumentTypeUseCase } from '@modules/catalogs/application/ports/input/documentTypes/IDeleteDocumentTypeUseCase';
import { IActivateDocumentTypeUseCase } from '@modules/catalogs/application/ports/input/documentTypes/IActivateDocumentTypeUseCase';
import { IDeactivateDocumentTypeUseCase } from '@modules/catalogs/application/ports/input/documentTypes/IDeactivateDocumentTypeUseCase';
import { CreateDocumentTypeDTO } from '@modules/catalogs/application/dto/documentTypes/CreateDocumentTypeDTO';
import { UpdateDocumentTypeDTO } from '@modules/catalogs/application/dto/documentTypes/UpdateDocumentTypeDTO';
import { ListDocumentTypesDTO } from '@modules/catalogs/application/dto/documentTypes/ListDocumentTypesDTO';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';

/**
 * Controller HTTP para la gestión de tipos de documento
 */
export class DocumentTypeController {
  constructor(
    private readonly createDocumentTypeUseCase: ICreateDocumentTypeUseCase,
    private readonly getDocumentTypeByIdUseCase: IGetDocumentTypeByIdUseCase,
    private readonly listDocumentTypesUseCase: IListDocumentTypesUseCase,
    private readonly updateDocumentTypeUseCase: IUpdateDocumentTypeUseCase,
    private readonly deleteDocumentTypeUseCase: IDeleteDocumentTypeUseCase,
    private readonly activateDocumentTypeUseCase: IActivateDocumentTypeUseCase,
    private readonly deactivateDocumentTypeUseCase: IDeactivateDocumentTypeUseCase,
    private readonly logger: ILogger
  ) {}

  private getCurrentUserId(req: Request | AuthenticatedRequest): string | undefined {
    if ('user' in req && req.user) {
      return req.user.id;
    }
    return undefined;
  }

  /**
   * POST /document-types
   * Crea un nuevo tipo de documento
   * Requiere autenticación (solo admin)
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateDocumentTypeDTO = req.body;
      const createdBy = this.getCurrentUserId(req);

      this.logger.info('Creando tipo de documento', {
        nombre: dto.nombre,
        kind: dto.kind,
        createdBy,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      const documentType = await this.createDocumentTypeUseCase.execute(dto, createdBy);

      this.logger.info('Tipo de documento creado exitosamente', {
        documentTypeId: documentType.id,
        nombre: documentType.nombre,
        kind: documentType.kind,
      });

      res.status(201).json(documentType.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /document-types/:id
   * Obtiene un tipo de documento por su ID
   * Requiere autenticación
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const documentType = await this.getDocumentTypeByIdUseCase.execute(id);

      res.status(200).json(documentType.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /document-types
   * Lista tipos de documento con filtros y paginación
   * Requiere autenticación
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const sortBy = req.query.sortBy as 'nombre' | 'kind' | 'createdAt' | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const filters: ListDocumentTypesDTO['filters'] = {};
      if (req.query.kind) {
        const kindStr = req.query.kind as string;
        if (Object.values(DocumentKind).includes(kindStr as DocumentKind)) {
          filters.kind = kindStr as DocumentKind;
        }
      }
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }
      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const dto: ListDocumentTypesDTO = {
        ...(Object.keys(filters).length > 0 && { filters }),
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      };

      const result = await this.listDocumentTypesUseCase.execute(dto);

      res.status(200).json({
        data: result.documentTypes.map((documentType) => documentType.toPublicJSON()),
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
   * PUT /document-types/:id
   * Actualiza un tipo de documento
   * Requiere autenticación (solo admin)
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const dto: UpdateDocumentTypeDTO = req.body;
      const performedBy = this.getCurrentUserId(req);

      const documentType = await this.updateDocumentTypeUseCase.execute(id, dto, performedBy);

      res.status(200).json(documentType.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /document-types/:id
   * Elimina un tipo de documento (baja lógica)
   * Requiere autenticación (solo admin)
   */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      this.logger.info('Eliminando tipo de documento', {
        targetDocumentTypeId: id,
        performedBy,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      await this.deleteDocumentTypeUseCase.execute(id, performedBy);

      this.logger.info('Tipo de documento eliminado exitosamente', {
        targetDocumentTypeId: id,
        performedBy,
      });

      res.status(200).json({
        message: 'Tipo de documento eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /document-types/:id/activate
   * Activa un tipo de documento
   * Requiere autenticación (solo admin)
   */
  async activate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      const documentType = await this.activateDocumentTypeUseCase.execute(id, performedBy);

      res.status(200).json({
        id: documentType.id,
        nombre: documentType.nombre,
        kind: documentType.kind,
        isActive: documentType.isActive,
        updatedAt: documentType.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /document-types/:id/deactivate
   * Desactiva un tipo de documento (baja lógica)
   * Requiere autenticación (solo admin)
   */
  async deactivate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      const documentType = await this.deactivateDocumentTypeUseCase.execute(id, performedBy);

      res.status(200).json({
        id: documentType.id,
        nombre: documentType.nombre,
        kind: documentType.kind,
        isActive: documentType.isActive,
        updatedAt: documentType.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }
}
