import { IEventBus, ILogger } from '@shared/domain';
import { Minute, MinuteNotFoundError, MinuteUpdated } from '../../domain';
import { IMinuteRepository } from '../../domain/ports/output/IMinuteRepository';
import { IUpdateMinuteUseCase } from '../ports/input/IUpdateMinuteUseCase';
import { UpdateMinuteDTO } from '../dto/UpdateMinuteDTO';

/**
 * Caso de uso para actualizar una minuta
 * 
 * Se encarga de:
 * - Validar que la minuta existe
 * - Actualizar los campos permitidos (titulo, tipo, descripcion, fecha, isActive)
 * - Persistir los cambios
 * - Publicar eventos de dominio (MinuteUpdated)
 */
export class UpdateMinuteUseCase implements IUpdateMinuteUseCase {
  constructor(
    private readonly minuteRepository: IMinuteRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID de la minuta a actualizar
   * @param dto - DTO con los campos a actualizar
   * @param updatedBy - ID del usuario que está actualizando la minuta
   * @returns La minuta actualizada
   * @throws MinuteNotFoundError si la minuta no existe
   */
  async execute(id: string, dto: UpdateMinuteDTO, updatedBy?: string): Promise<Minute> {
    this.logger.info('Ejecutando caso de uso: Actualizar minuta', {
      minuteId: id,
      updatedBy,
      fields: Object.keys(dto),
    });

    // Verificar que la minuta existe
    const existingMinute = await this.minuteRepository.findById(id);
    if (!existingMinute) {
      this.logger.warn('Intento de actualizar minuta inexistente', {
        minuteId: id,
        updatedBy,
      });
      throw new MinuteNotFoundError(id);
    }

    // Actualizar campos permitidos
    const updatedFields: string[] = [];

    if (dto.titulo !== undefined) {
      existingMinute.updateTitulo(dto.titulo);
      updatedFields.push('titulo');
    }

    if (dto.tipo !== undefined) {
      existingMinute.updateTipo(dto.tipo);
      updatedFields.push('tipo');
    }

    if (dto.descripcion !== undefined) {
      existingMinute.updateDescripcion(dto.descripcion);
      updatedFields.push('descripcion');
    }

    if (dto.fecha !== undefined) {
      // Convertir fecha si viene como string
      const fecha = dto.fecha instanceof Date ? dto.fecha : new Date(dto.fecha);
      existingMinute.updateFecha(fecha);
      updatedFields.push('fecha');
    }

    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        existingMinute.activate();
      } else {
        existingMinute.deactivate();
      }
      updatedFields.push('isActive');
    }

    // Persistir los cambios
    const updatedMinute = await this.minuteRepository.update(existingMinute);

    // Publicar evento de dominio
    await this.eventBus.publish(new MinuteUpdated(updatedMinute, updatedBy, updatedFields));

    this.logger.info('Minuta actualizada exitosamente', {
      minuteId: id,
      updatedFields,
      updatedBy,
    });

    return updatedMinute;
  }
}
