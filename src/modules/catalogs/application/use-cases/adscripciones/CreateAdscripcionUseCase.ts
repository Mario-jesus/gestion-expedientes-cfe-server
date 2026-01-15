import { IEventBus, ILogger } from '@shared/domain';
import { Adscripcion } from '../../../domain/entities/Adscripcion';
import { DuplicateAdscripcionError } from '../../../domain/exceptions/DuplicateAdscripcionError';
import { AdscripcionCreated } from '../../../domain/events/AdscripcionCreated';
import { IAdscripcionRepository } from '../../../domain/ports/output/IAdscripcionRepository';
import { ICreateAdscripcionUseCase } from '../../ports/input/adscripciones/ICreateAdscripcionUseCase';
import { CreateAdscripcionDTO } from '../../dto/adscripciones/CreateAdscripcionDTO';

/**
 * Caso de uso para crear una nueva adscripción
 */
export class CreateAdscripcionUseCase implements ICreateAdscripcionUseCase {
  constructor(
    private readonly adscripcionRepository: IAdscripcionRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(dto: CreateAdscripcionDTO, createdBy?: string): Promise<Adscripcion> {
    this.logger.info('Ejecutando caso de uso: Crear adscripción', {
      nombre: dto.nombre,
      adscripcion: dto.adscripcion,
      createdBy,
    });

    // Validar que el valor de adscripcion no exista (único)
    const adscripcionExists = await this.adscripcionRepository.existsByAdscripcion(dto.adscripcion);
    if (adscripcionExists) {
      this.logger.warn('Intento de crear adscripción con valor duplicado', {
        adscripcion: dto.adscripcion,
        createdBy,
      });
      throw new DuplicateAdscripcionError(dto.adscripcion);
    }

    // Crear la entidad Adscripcion
    const adscripcion = Adscripcion.create({
      nombre: dto.nombre,
      adscripcion: dto.adscripcion,
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
