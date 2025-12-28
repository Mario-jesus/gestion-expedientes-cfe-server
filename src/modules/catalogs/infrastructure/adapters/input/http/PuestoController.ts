import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@shared/domain';
import { AuthenticatedRequest } from '@shared/infrastructure';
import { ICreatePuestoUseCase } from '@modules/catalogs/application/ports/input/puestos/ICreatePuestoUseCase';
import { IGetPuestoByIdUseCase } from '@modules/catalogs/application/ports/input/puestos/IGetPuestoByIdUseCase';
import { IListPuestosUseCase } from '@modules/catalogs/application/ports/input/puestos/IListPuestosUseCase';
import { IUpdatePuestoUseCase } from '@modules/catalogs/application/ports/input/puestos/IUpdatePuestoUseCase';
import { IDeletePuestoUseCase } from '@modules/catalogs/application/ports/input/puestos/IDeletePuestoUseCase';
import { IActivatePuestoUseCase } from '@modules/catalogs/application/ports/input/puestos/IActivatePuestoUseCase';
import { IDeactivatePuestoUseCase } from '@modules/catalogs/application/ports/input/puestos/IDeactivatePuestoUseCase';
import { CreatePuestoDTO } from '@modules/catalogs/application/dto/puestos/CreatePuestoDTO';
import { UpdatePuestoDTO } from '@modules/catalogs/application/dto/puestos/UpdatePuestoDTO';
import { ListPuestosDTO } from '@modules/catalogs/application/dto/puestos/ListPuestosDTO';

/**
 * Controller HTTP para la gestión de puestos
 */
export class PuestoController {
  constructor(
    private readonly createPuestoUseCase: ICreatePuestoUseCase,
    private readonly getPuestoByIdUseCase: IGetPuestoByIdUseCase,
    private readonly listPuestosUseCase: IListPuestosUseCase,
    private readonly updatePuestoUseCase: IUpdatePuestoUseCase,
    private readonly deletePuestoUseCase: IDeletePuestoUseCase,
    private readonly activatePuestoUseCase: IActivatePuestoUseCase,
    private readonly deactivatePuestoUseCase: IDeactivatePuestoUseCase,
    private readonly logger: ILogger
  ) {}

  private getCurrentUserId(req: Request | AuthenticatedRequest): string | undefined {
    if ('user' in req && req.user) {
      return req.user.id;
    }
    return undefined;
  }

  /**
   * POST /puestos
   * Crea un nuevo puesto
   * Requiere autenticación (solo admin)
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreatePuestoDTO = req.body;
      const createdBy = this.getCurrentUserId(req);

      this.logger.info('Creando puesto', {
        nombre: dto.nombre,
        createdBy,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      const puesto = await this.createPuestoUseCase.execute(dto, createdBy);

      this.logger.info('Puesto creado exitosamente', {
        puestoId: puesto.id,
        nombre: puesto.nombre,
      });

      res.status(201).json(puesto.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /puestos/:id
   * Obtiene un puesto por su ID
   * Requiere autenticación
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const puesto = await this.getPuestoByIdUseCase.execute(id);

      res.status(200).json(puesto.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /puestos
   * Lista puestos con filtros y paginación
   * Requiere autenticación
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const sortBy = req.query.sortBy as 'nombre' | 'createdAt' | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const filters: ListPuestosDTO['filters'] = {};
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }
      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const dto: ListPuestosDTO = {
        ...(Object.keys(filters).length > 0 && { filters }),
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      };

      const result = await this.listPuestosUseCase.execute(dto);

      res.status(200).json({
        data: result.puestos.map((puesto) => puesto.toPublicJSON()),
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
   * PUT /puestos/:id
   * Actualiza un puesto
   * Requiere autenticación (solo admin)
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const dto: UpdatePuestoDTO = req.body;
      const performedBy = this.getCurrentUserId(req);

      const puesto = await this.updatePuestoUseCase.execute(id, dto, performedBy);

      res.status(200).json(puesto.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /puestos/:id
   * Elimina un puesto (baja lógica)
   * Requiere autenticación (solo admin)
   */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      this.logger.info('Eliminando puesto', {
        targetPuestoId: id,
        performedBy,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      await this.deletePuestoUseCase.execute(id, performedBy);

      this.logger.info('Puesto eliminado exitosamente', {
        targetPuestoId: id,
        performedBy,
      });

      res.status(200).json({
        message: 'Puesto eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /puestos/:id/activate
   * Activa un puesto
   * Requiere autenticación (solo admin)
   */
  async activate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      const puesto = await this.activatePuestoUseCase.execute(id, performedBy);

      res.status(200).json({
        id: puesto.id,
        nombre: puesto.nombre,
        isActive: puesto.isActive,
        updatedAt: puesto.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /puestos/:id/deactivate
   * Desactiva un puesto (baja lógica)
   * Requiere autenticación (solo admin)
   */
  async deactivate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      const puesto = await this.deactivatePuestoUseCase.execute(id, performedBy);

      res.status(200).json({
        id: puesto.id,
        nombre: puesto.nombre,
        isActive: puesto.isActive,
        updatedAt: puesto.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }
}
