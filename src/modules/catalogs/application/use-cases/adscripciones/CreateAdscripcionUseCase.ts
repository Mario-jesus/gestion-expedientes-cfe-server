import { IEventBus, ILogger } from '@shared/domain';
import { Adscripcion } from '../../../domain/entities/Adscripcion';
import { AreaNotFoundError } from '../../../domain/exceptions/AreaNotFoundError';
import { DuplicateAdscripcionError } from '../../../domain/exceptions/DuplicateAdscripcionError';
import { AdscripcionCreated } from '../../../domain/events/AdscripcionCreated';
import { IAdscripcionRepository } from '../../../domain/ports/output/IAdscripcionRepository';
import { IAreaRepository } from '../../../domain/ports/output/IAreaRepository';
import { ICreateAdscripcionUseCase } from '../../ports/input/adscripciones/ICreateAdscripcionUseCase';
import { CreateAdscripcionDTO } from '../../dto/adscripciones/CreateAdscripcionDTO';

/**
 * Caso de uso para crear una nueva adscripción
 */
export class CreateAdscripcionUseCase implements ICreateAdscripcionUseCase {
  constructor(
    private readonly adscripcionRepository: IAdscripcionRepository,
    private readonly areaRepository: IAreaRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(dto: CreateAdscripcionDTO, createdBy?: string): Promise<Adscripcion> {
    this.logger.info('Ejecutando caso de uso: Crear adscripción', {
      nombre: dto.nombre,
      areaId: dto.areaId,
      createdBy,
    });

    // Validar que el área existe
    const area = await this.areaRepository.findById(dto.areaId);
    if (!area) {
      this.logger.warn('Intento de crear adscripción con área inexistente', {
        areaId: dto.areaId,
        nombre: dto.nombre,
        createdBy,
      });
      throw new AreaNotFoundError(dto.areaId);
    }

    // Validar que el nombre no exista en el área
    const nombreExists = await this.adscripcionRepository.existsByNombreAndAreaId(
      dto.nombre,
      dto.areaId
    );
    if (nombreExists) {
      this.logger.warn('Intento de crear adscripción con nombre duplicado en el área', {
        nombre: dto.nombre,
        areaId: dto.areaId,
        createdBy,
      });
      throw new DuplicateAdscripcionError(dto.nombre, dto.areaId);
    }

    // Crear la entidad Adscripcion
    const adscripcion = Adscripcion.create({
      nombre: dto.nombre,
      areaId: dto.areaId,
      descripcion: dto.descripcion,
      isActive: dto.isActive ?? true,
    });

    // Persistir la adscripción
    const savedAdscripcion = await this.adscripcionRepository.create(adscripcion);

    // Publicar evento de dominio
    await this.eventBus.publish(new AdscripcionCreated(savedAdscripcion, createdBy));

    this.logger.info('Adscripción creada exitosamente', {
      adscripcionId: savedAdscripcion.id,
      nombre: savedAdscripcion.nombre,
      createdBy,
    });

    return savedAdscripcion;
  }
}
