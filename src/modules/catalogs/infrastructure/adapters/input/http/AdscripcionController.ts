import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@shared/domain';
import { AuthenticatedRequest } from '@shared/infrastructure';
import { ICreateAdscripcionUseCase } from '@modules/catalogs/application/ports/input/adscripciones/ICreateAdscripcionUseCase';
import { IGetAdscripcionByIdUseCase } from '@modules/catalogs/application/ports/input/adscripciones/IGetAdscripcionByIdUseCase';
import { IListAdscripcionesUseCase } from '@modules/catalogs/application/ports/input/adscripciones/IListAdscripcionesUseCase';
import { IUpdateAdscripcionUseCase } from '@modules/catalogs/application/ports/input/adscripciones/IUpdateAdscripcionUseCase';
import { IDeleteAdscripcionUseCase } from '@modules/catalogs/application/ports/input/adscripciones/IDeleteAdscripcionUseCase';
import { IActivateAdscripcionUseCase } from '@modules/catalogs/application/ports/input/adscripciones/IActivateAdscripcionUseCase';
import { IDeactivateAdscripcionUseCase } from '@modules/catalogs/application/ports/input/adscripciones/IDeactivateAdscripcionUseCase';
import { CreateAdscripcionDTO } from '@modules/catalogs/application/dto/adscripciones/CreateAdscripcionDTO';
import { UpdateAdscripcionDTO } from '@modules/catalogs/application/dto/adscripciones/UpdateAdscripcionDTO';
import { ListAdscripcionesDTO } from '@modules/catalogs/application/dto/adscripciones/ListAdscripcionesDTO';

/**
 * Controller HTTP para la gestión de adscripciones
 */
export class AdscripcionController {
  constructor(
    private readonly createAdscripcionUseCase: ICreateAdscripcionUseCase,
    private readonly getAdscripcionByIdUseCase: IGetAdscripcionByIdUseCase,
    private readonly listAdscripcionesUseCase: IListAdscripcionesUseCase,
    private readonly updateAdscripcionUseCase: IUpdateAdscripcionUseCase,
    private readonly deleteAdscripcionUseCase: IDeleteAdscripcionUseCase,
    private readonly activateAdscripcionUseCase: IActivateAdscripcionUseCase,
    private readonly deactivateAdscripcionUseCase: IDeactivateAdscripcionUseCase,
    private readonly logger: ILogger
  ) {}

  private getCurrentUserId(req: Request | AuthenticatedRequest): string | undefined {
    if ('user' in req && req.user) {
      return req.user.id;
    }
    return undefined;
  }

  /**
   * POST /adscripciones
   * Crea una nueva adscripción
   * Requiere autenticación (solo admin)
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateAdscripcionDTO = req.body;
      const createdBy = this.getCurrentUserId(req);

      this.logger.info('Creando adscripción', {
        nombre: dto.nombre,
        adscripcion: dto.adscripcion,
        createdBy,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      const adscripcion = await this.createAdscripcionUseCase.execute(dto, createdBy);

      this.logger.info('Adscripción creada exitosamente', {
        adscripcionId: adscripcion.id,
        nombre: adscripcion.nombre,
      });

      res.status(201).json(adscripcion.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /adscripciones/:id
   * Obtiene una adscripción por su ID
   * Requiere autenticación
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const adscripcion = await this.getAdscripcionByIdUseCase.execute(id);

      res.status(200).json(adscripcion.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /adscripciones
   * Lista adscripciones con filtros y paginación
   * Requiere autenticación
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const sortBy = req.query.sortBy as 'nombre' | 'createdAt' | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const filters: ListAdscripcionesDTO['filters'] = {};
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }
      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const dto: ListAdscripcionesDTO = {
        ...(Object.keys(filters).length > 0 && { filters }),
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      };

      const result = await this.listAdscripcionesUseCase.execute(dto);

      res.status(200).json({
        data: result.adscripciones.map((adscripcion) => adscripcion.toPublicJSON()),
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
   * PUT /adscripciones/:id
   * Actualiza una adscripción
   * Requiere autenticación (solo admin)
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const dto: UpdateAdscripcionDTO = req.body;
      const performedBy = this.getCurrentUserId(req);

      const adscripcion = await this.updateAdscripcionUseCase.execute(id, dto, performedBy);

      res.status(200).json(adscripcion.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /adscripciones/:id
   * Elimina una adscripción (baja lógica)
   * Requiere autenticación (solo admin)
   */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      this.logger.info('Eliminando adscripción', {
        targetAdscripcionId: id,
        performedBy,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      await this.deleteAdscripcionUseCase.execute(id, performedBy);

      this.logger.info('Adscripción eliminada exitosamente', {
        targetAdscripcionId: id,
        performedBy,
      });

      res.status(200).json({
        message: 'Adscripción eliminada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /adscripciones/:id/activate
   * Activa una adscripción
   * Requiere autenticación (solo admin)
   */
  async activate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      const adscripcion = await this.activateAdscripcionUseCase.execute(id, performedBy);

      res.status(200).json({
        id: adscripcion.id,
        nombre: adscripcion.nombre,
        isActive: adscripcion.isActive,
        updatedAt: adscripcion.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /adscripciones/:id/deactivate
   * Desactiva una adscripción (baja lógica)
   * Requiere autenticación (solo admin)
   */
  async deactivate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const performedBy = this.getCurrentUserId(req);

      const adscripcion = await this.deactivateAdscripcionUseCase.execute(id, performedBy);

      res.status(200).json({
        id: adscripcion.id,
        nombre: adscripcion.nombre,
        isActive: adscripcion.isActive,
        updatedAt: adscripcion.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }
}
