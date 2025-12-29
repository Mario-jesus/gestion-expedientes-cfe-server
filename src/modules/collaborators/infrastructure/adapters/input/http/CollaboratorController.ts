import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@shared/domain';
import { AuthenticatedRequest } from '@shared/infrastructure';
import { ICreateCollaboratorUseCase } from '@modules/collaborators/application/ports/input/ICreateCollaboratorUseCase';
import { IGetCollaboratorByIdUseCase } from '@modules/collaborators/application/ports/input/IGetCollaboratorByIdUseCase';
import { IListCollaboratorsUseCase } from '@modules/collaborators/application/ports/input/IListCollaboratorsUseCase';
import { IUpdateCollaboratorUseCase } from '@modules/collaborators/application/ports/input/IUpdateCollaboratorUseCase';
import { IDeleteCollaboratorUseCase } from '@modules/collaborators/application/ports/input/IDeleteCollaboratorUseCase';
import { IActivateCollaboratorUseCase } from '@modules/collaborators/application/ports/input/IActivateCollaboratorUseCase';
import { IDeactivateCollaboratorUseCase } from '@modules/collaborators/application/ports/input/IDeactivateCollaboratorUseCase';
import { IGetDocumentsByCollaboratorIdUseCase } from '@modules/collaborators/application/ports/input/IGetDocumentsByCollaboratorIdUseCase';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';
import { CreateCollaboratorDTO } from '@modules/collaborators/application/dto/CreateCollaboratorDTO';
import { UpdateCollaboratorDTO } from '@modules/collaborators/application/dto/UpdateCollaboratorDTO';
import { ListCollaboratorsDTO } from '@modules/collaborators/application/dto/ListCollaboratorsDTO';
import { TipoContrato } from '@modules/collaborators/domain/enums/TipoContrato';

/**
 * Controller HTTP para la gestión de colaboradores
 * 
 * Este controller actúa como adaptador de entrada (Input Adapter) que convierte
 * requests HTTP en llamadas a casos de uso de la capa de aplicación.
 * 
 * Responsabilidades:
 * - Recibir requests HTTP
 * - Validar y mapear datos del request a DTOs
 * - Llamar a los casos de uso correspondientes
 * - Formatear respuestas HTTP
 * - Manejar errores (delegados al errorHandler de Express)
 */
export class CollaboratorController {
  constructor(
    private readonly createCollaboratorUseCase: ICreateCollaboratorUseCase,
    private readonly getCollaboratorByIdUseCase: IGetCollaboratorByIdUseCase,
    private readonly listCollaboratorsUseCase: IListCollaboratorsUseCase,
    private readonly updateCollaboratorUseCase: IUpdateCollaboratorUseCase,
    private readonly deleteCollaboratorUseCase: IDeleteCollaboratorUseCase,
    private readonly activateCollaboratorUseCase: IActivateCollaboratorUseCase,
    private readonly deactivateCollaboratorUseCase: IDeactivateCollaboratorUseCase,
    private readonly getDocumentsByCollaboratorIdUseCase: IGetDocumentsByCollaboratorIdUseCase,
    private readonly logger: ILogger
  ) {}

  /**
   * Obtiene el ID del usuario autenticado desde el request
   * El request debe ser AuthenticatedRequest (después del middleware authenticate)
   */
  private getCurrentUserId(req: Request | AuthenticatedRequest): string | undefined {
    if ('user' in req && req.user) {
      return req.user.id;
    }
    return undefined;
  }

  /**
   * POST /collaborators
   * Crea un nuevo colaborador
   * Requiere autenticación
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateCollaboratorDTO = req.body;
      const createdBy = this.getCurrentUserId(req);

      this.logger.info('Creando colaborador', {
        rpe: dto.rpe,
        nombre: dto.nombre,
        apellidos: dto.apellidos,
        createdBy,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      const collaborator = await this.createCollaboratorUseCase.execute(dto, createdBy);

      this.logger.info('Colaborador creado exitosamente', {
        collaboratorId: collaborator.id,
        rpe: collaborator.rpeValue,
      });

      res.status(201).json(collaborator.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /collaborators/:id
   * Obtiene un colaborador por su ID
   * Requiere autenticación
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const collaborator = await this.getCollaboratorByIdUseCase.execute(id);

      res.status(200).json(collaborator.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /collaborators
   * Lista colaboradores con filtros y paginación
   * Requiere autenticación
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validar y convertir tipoContrato a TipoContrato si está presente
      let tipoContrato: TipoContrato | undefined;
      if (req.query.tipoContrato) {
        const tipoContratoStr = req.query.tipoContrato as string;
        if (Object.values(TipoContrato).includes(tipoContratoStr as TipoContrato)) {
          tipoContrato = tipoContratoStr as TipoContrato;
        }
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const sortBy = req.query.sortBy as 'nombre' | 'rpe' | 'createdAt' | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const filters: ListCollaboratorsDTO['filters'] = {};
      if (req.query.areaId) {
        filters.areaId = req.query.areaId as string;
      }
      if (req.query.adscripcionId) {
        filters.adscripcionId = req.query.adscripcionId as string;
      }
      if (req.query.puestoId) {
        filters.puestoId = req.query.puestoId as string;
      }
      if (tipoContrato) {
        filters.tipoContrato = tipoContrato;
      }
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }
      if (req.query.search) {
        filters.search = req.query.search as string;
      }
      if (req.query.estadoExpediente) {
        const estadoExpediente = req.query.estadoExpediente as string;
        if (
          estadoExpediente === 'completo' ||
          estadoExpediente === 'incompleto' ||
          estadoExpediente === 'sin_documentos'
        ) {
          filters.estadoExpediente = estadoExpediente;
        }
      }

      const dto: ListCollaboratorsDTO = {
        ...(Object.keys(filters).length > 0 && { filters }),
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      };

      const result = await this.listCollaboratorsUseCase.execute(dto);

      res.status(200).json({
        data: result.collaborators.map((collaborator) => collaborator.toPublicJSON()),
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
   * PUT /collaborators/:id
   * Actualiza un colaborador (actualización completa)
   * Requiere autenticación
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const dto: UpdateCollaboratorDTO = req.body;
      const performedBy = this.getCurrentUserId(req);

      const collaborator = await this.updateCollaboratorUseCase.execute(id, dto, performedBy);

      res.status(200).json(collaborator.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /collaborators/:id
   * Actualiza parcialmente un colaborador (misma lógica que PUT)
   * Requiere autenticación
   */
  async partialUpdate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const dto: UpdateCollaboratorDTO = req.body;
      const performedBy = this.getCurrentUserId(req);

      const collaborator = await this.updateCollaboratorUseCase.execute(id, dto, performedBy);

      res.status(200).json(collaborator.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /collaborators/:id
   * Elimina un colaborador (baja lógica)
   * Requiere autenticación
   */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      this.logger.info('Eliminando colaborador', {
        targetCollaboratorId: id,
        performedBy,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      await this.deleteCollaboratorUseCase.execute(id, performedBy);

      this.logger.info('Colaborador eliminado exitosamente', {
        targetCollaboratorId: id,
        performedBy,
      });

      res.status(200).json({
        message: 'Colaborador eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /collaborators/:id/activate
   * Activa un colaborador
   * Requiere autenticación
   */
  async activate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      const collaborator = await this.activateCollaboratorUseCase.execute(id, performedBy);

      res.status(200).json({
        id: collaborator.id,
        rpe: collaborator.rpeValue,
        nombreCompleto: collaborator.nombreCompleto,
        isActive: collaborator.isActive,
        updatedAt: collaborator.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /collaborators/:id/deactivate
   * Desactiva un colaborador (baja lógica)
   * Requiere autenticación
   */
  async deactivate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      const collaborator = await this.deactivateCollaboratorUseCase.execute(id, performedBy);

      res.status(200).json({
        id: collaborator.id,
        rpe: collaborator.rpeValue,
        nombreCompleto: collaborator.nombreCompleto,
        isActive: collaborator.isActive,
        updatedAt: collaborator.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /collaborators/:id/documents
   * Obtiene todos los documentos de un colaborador específico
   * Requiere autenticación
   */
  async getDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const collaboratorId = req.params.id as string;

      // Extraer filtros opcionales de query params
      const filters: {
        kind?: DocumentKind;
        isActive?: boolean;
      } = {};

      if (req.query.kind) {
        const kindStr = req.query.kind as string;
        if (Object.values(DocumentKind).includes(kindStr as DocumentKind)) {
          filters.kind = kindStr as DocumentKind;
        }
      }

      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }

      this.logger.debug('Obteniendo documentos del colaborador', {
        collaboratorId,
        filters,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      const documents = await this.getDocumentsByCollaboratorIdUseCase.execute(collaboratorId, filters);

      this.logger.debug('Documentos obtenidos exitosamente', {
        collaboratorId,
        total: documents.length,
      });

      res.status(200).json({
        data: documents.map((doc) => doc.toPublicJSON()),
        total: documents.length,
      });
    } catch (error) {
      next(error);
    }
  }
}
