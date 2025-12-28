import { IEventBus, ILogger } from '@shared/domain';
import { MinuteNotFoundError, MinuteDeleted } from '../../domain';
import { IMinuteRepository } from '../../domain/ports/output/IMinuteRepository';
import { IDeleteMinuteUseCase } from '../ports/input/IDeleteMinuteUseCase';

/**
 * Caso de uso para eliminar una minuta (baja lógica)
 * 
 * Se encarga de:
 * - Validar que la minuta existe
 * - Marcar la minuta como inactiva (baja lógica)
 * - Persistir los cambios
 * - Publicar eventos de dominio (MinuteDeleted)
 */
export class DeleteMinuteUseCase implements IDeleteMinuteUseCase {
  constructor(
    private readonly minuteRepository: IMinuteRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID de la minuta a eliminar
   * @param deletedBy - ID del usuario que está eliminando la minuta
   * @returns true si se eliminó, false si no existía
   * @throws MinuteNotFoundError si la minuta no existe
   */
  async execute(id: string, deletedBy?: string): Promise<boolean> {
    this.logger.info('Ejecutando caso de uso: Eliminar minuta', {
      minuteId: id,
      deletedBy,
    });

    // Verificar que la minuta existe antes de eliminarla
    const minute = await this.minuteRepository.findById(id);
    if (!minute) {
      this.logger.warn('Intento de eliminar minuta inexistente', {
        minuteId: id,
        deletedBy,
      });
      throw new MinuteNotFoundError(id);
    }

    // Eliminar la minuta (baja lógica)
    const deleted = await this.minuteRepository.delete(id);

    if (deleted) {
      // Publicar evento de dominio solo si se eliminó correctamente
      await this.eventBus.publish(new MinuteDeleted(minute, deletedBy));
      this.logger.info('Minuta eliminada exitosamente', {
        minuteId: id,
        deletedBy,
      });
    }

    return deleted;
  }
}
