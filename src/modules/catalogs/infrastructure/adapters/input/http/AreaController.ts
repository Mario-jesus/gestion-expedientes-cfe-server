import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@shared/domain';
import { AuthenticatedRequest } from '@shared/infrastructure';
import { ICreateAreaUseCase } from '@modules/catalogs/application/ports/input/areas/ICreateAreaUseCase';
import { IGetAreaByIdUseCase } from '@modules/catalogs/application/ports/input/areas/IGetAreaByIdUseCase';
import { IListAreasUseCase } from '@modules/catalogs/application/ports/input/areas/IListAreasUseCase';
import { IUpdateAreaUseCase } from '@modules/catalogs/application/ports/input/areas/IUpdateAreaUseCase';
import { IDeleteAreaUseCase } from '@modules/catalogs/application/ports/input/areas/IDeleteAreaUseCase';
import { IActivateAreaUseCase } from '@modules/catalogs/application/ports/input/areas/IActivateAreaUseCase';
import { IDeactivateAreaUseCase } from '@modules/catalogs/application/ports/input/areas/IDeactivateAreaUseCase';
import { CreateAreaDTO } from '@modules/catalogs/application/dto/areas/CreateAreaDTO';
import { UpdateAreaDTO } from '@modules/catalogs/application/dto/areas/UpdateAreaDTO';
import { ListAreasDTO } from '@modules/catalogs/application/dto/areas/ListAreasDTO';

/**
 * Controller HTTP para la gestión de áreas
 */
export class AreaController {
  constructor(
    private readonly createAreaUseCase: ICreateAreaUseCase,
    private readonly getAreaByIdUseCase: IGetAreaByIdUseCase,
    private readonly listAreasUseCase: IListAreasUseCase,
    private readonly updateAreaUseCase: IUpdateAreaUseCase,
    private readonly deleteAreaUseCase: IDeleteAreaUseCase,
    private readonly activateAreaUseCase: IActivateAreaUseCase,
    private readonly deactivateAreaUseCase: IDeactivateAreaUseCase,
    private readonly logger: ILogger
  ) {}

  private getCurrentUserId(req: Request | AuthenticatedRequest): string | undefined {
    if ('user' in req && req.user) {
      return req.user.id;
    }
    return undefined;
  }

  /**
   * POST /areas
   * Crea un nuevo área
   * Requiere autenticación (solo admin)
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateAreaDTO = req.body;
      const createdBy = this.getCurrentUserId(req);

      this.logger.info('Creando área', {
        nombre: dto.nombre,
        createdBy,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      const area = await this.createAreaUseCase.execute(dto, createdBy);

      this.logger.info('Área creada exitosamente', {
        areaId: area.id,
        nombre: area.nombre,
      });

      res.status(201).json(area.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /areas/:id
   * Obtiene un área por su ID
   * Requiere autenticación
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const area = await this.getAreaByIdUseCase.execute(id);

      res.status(200).json(area.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /areas
   * Lista áreas con filtros y paginación
   * Requiere autenticación
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const sortBy = req.query.sortBy as 'nombre' | 'createdAt' | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const filters: ListAreasDTO['filters'] = {};
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }
      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const dto: ListAreasDTO = {
        ...(Object.keys(filters).length > 0 && { filters }),
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      };

      const result = await this.listAreasUseCase.execute(dto);

      res.status(200).json({
        data: result.areas.map((area) => area.toPublicJSON()),
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
   * PUT /areas/:id
   * Actualiza un área
   * Requiere autenticación (solo admin)
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const dto: UpdateAreaDTO = req.body;
      const performedBy = this.getCurrentUserId(req);

      const area = await this.updateAreaUseCase.execute(id, dto, performedBy);

      res.status(200).json(area.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /areas/:id
   * Elimina un área (baja lógica)
   * Requiere autenticación (solo admin)
   */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      this.logger.info('Eliminando área', {
        targetAreaId: id,
        performedBy,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      await this.deleteAreaUseCase.execute(id, performedBy);

      this.logger.info('Área eliminada exitosamente', {
        targetAreaId: id,
        performedBy,
      });

      res.status(200).json({
        message: 'Área eliminada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /areas/:id/activate
   * Activa un área
   * Requiere autenticación (solo admin)
   */
  async activate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      const area = await this.activateAreaUseCase.execute(id, performedBy);

      res.status(200).json({
        id: area.id,
        nombre: area.nombre,
        isActive: area.isActive,
        updatedAt: area.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /areas/:id/deactivate
   * Desactiva un área (baja lógica)
   * Requiere autenticación (solo admin)
   */
  async deactivate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      const area = await this.deactivateAreaUseCase.execute(id, performedBy);

      res.status(200).json({
        id: area.id,
        nombre: area.nombre,
        isActive: area.isActive,
        updatedAt: area.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

}
