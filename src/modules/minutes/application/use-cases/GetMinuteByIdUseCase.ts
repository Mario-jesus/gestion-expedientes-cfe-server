import { ILogger } from '@shared/domain';
import { Minute, MinuteNotFoundError } from '../../domain';
import { IMinuteRepository } from '../../domain/ports/output/IMinuteRepository';
import { IGetMinuteByIdUseCase } from '../ports/input/IGetMinuteByIdUseCase';

/**
 * Caso de uso para obtener una minuta por su ID
 */
export class GetMinuteByIdUseCase implements IGetMinuteByIdUseCase {
  constructor(
    private readonly minuteRepository: IMinuteRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID de la minuta a buscar
   * @returns La minuta encontrada
   * @throws MinuteNotFoundError si la minuta no existe
   */
  async execute(id: string): Promise<Minute> {
    this.logger.debug('Ejecutando caso de uso: Obtener minuta por ID', {
      minuteId: id,
    });

    const minute = await this.minuteRepository.findById(id);

    if (!minute) {
      this.logger.warn('Intento de obtener minuta inexistente', {
        minuteId: id,
      });
      throw new MinuteNotFoundError(id);
    }

    this.logger.debug('Minuta obtenida exitosamente', {
      minuteId: id,
      titulo: minute.titulo,
      tipo: minute.tipo,
    });

    return minute;
  }
}
