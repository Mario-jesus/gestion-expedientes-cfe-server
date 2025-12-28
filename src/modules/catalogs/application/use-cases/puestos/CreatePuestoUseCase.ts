import { IEventBus, ILogger } from '@shared/domain';
import { Puesto } from '../../../domain/entities/Puesto';
import { DuplicatePuestoError } from '../../../domain/exceptions/DuplicatePuestoError';
import { PuestoCreated } from '../../../domain/events/PuestoCreated';
import { IPuestoRepository } from '../../../domain/ports/output/IPuestoRepository';
import { ICreatePuestoUseCase } from '../../ports/input/puestos/ICreatePuestoUseCase';
import { CreatePuestoDTO } from '../../dto/puestos/CreatePuestoDTO';

/**
 * Caso de uso para crear un nuevo puesto
 */
export class CreatePuestoUseCase implements ICreatePuestoUseCase {
  constructor(
    private readonly puestoRepository: IPuestoRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(dto: CreatePuestoDTO, createdBy?: string): Promise<Puesto> {
    this.logger.info('Ejecutando caso de uso: Crear puesto', {
      nombre: dto.nombre,
      createdBy,
    });

    // Validar que el nombre no exista
    const nombreExists = await this.puestoRepository.existsByNombre(dto.nombre);
    if (nombreExists) {
      this.logger.warn('Intento de crear puesto con nombre duplicado', {
        nombre: dto.nombre,
        createdBy,
      });
      throw new DuplicatePuestoError(dto.nombre);
    }

    // Crear la entidad Puesto
    const puesto = Puesto.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      isActive: dto.isActive ?? true,
    });

    // Persistir el puesto
    const savedPuesto = await this.puestoRepository.create(puesto);

    // Publicar evento de dominio
    await this.eventBus.publish(new PuestoCreated(savedPuesto, createdBy));

    this.logger.info('Puesto creado exitosamente', {
      puestoId: savedPuesto.id,
      nombre: savedPuesto.nombre,
      createdBy,
    });

    return savedPuesto;
  }
}
