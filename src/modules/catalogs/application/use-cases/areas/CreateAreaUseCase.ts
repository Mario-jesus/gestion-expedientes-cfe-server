import { IEventBus, ILogger } from '@shared/domain';
import { Area } from '../../../domain/entities/Area';
import { DuplicateAreaError } from '../../../domain/exceptions/DuplicateAreaError';
import { AreaCreated } from '../../../domain/events/AreaCreated';
import { IAreaRepository } from '../../../domain/ports/output/IAreaRepository';
import { ICreateAreaUseCase } from '../../ports/input/areas/ICreateAreaUseCase';
import { CreateAreaDTO } from '../../dto/areas/CreateAreaDTO';

/**
 * Caso de uso para crear un nuevo área
 */
export class CreateAreaUseCase implements ICreateAreaUseCase {
  constructor(
    private readonly areaRepository: IAreaRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con los datos del área a crear
   * @param createdBy - ID del usuario que está creando este área (opcional)
   * @returns El área creada
   * @throws DuplicateAreaError si el nombre ya existe
   */
  async execute(dto: CreateAreaDTO, createdBy?: string): Promise<Area> {
    this.logger.info('Ejecutando caso de uso: Crear área', {
      nombre: dto.nombre,
      createdBy,
    });

    // Validar que el nombre no exista
    const nombreExists = await this.areaRepository.existsByNombre(dto.nombre);
    if (nombreExists) {
      this.logger.warn('Intento de crear área con nombre duplicado', {
        nombre: dto.nombre,
        createdBy,
      });
      throw new DuplicateAreaError(dto.nombre);
    }

    // Crear la entidad Area
    const area = Area.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      isActive: dto.isActive ?? true,
    });

    // Persistir el área
    const savedArea = await this.areaRepository.create(area);

    // Publicar evento de dominio
    await this.eventBus.publish(new AreaCreated(savedArea, createdBy));

    this.logger.info('Área creada exitosamente', {
      areaId: savedArea.id,
      nombre: savedArea.nombre,
      createdBy,
    });

    return savedArea;
  }
}
