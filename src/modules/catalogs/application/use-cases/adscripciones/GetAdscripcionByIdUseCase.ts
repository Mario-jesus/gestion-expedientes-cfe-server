import { ILogger } from '@shared/domain';
import { Adscripcion } from '../../../domain/entities/Adscripcion';
import { AdscripcionNotFoundError } from '../../../domain/exceptions/AdscripcionNotFoundError';
import { IAdscripcionRepository } from '../../../domain/ports/output/IAdscripcionRepository';
import { IGetAdscripcionByIdUseCase } from '../../ports/input/adscripciones/IGetAdscripcionByIdUseCase';

/**
 * Caso de uso para obtener una adscripción por su ID
 */
export class GetAdscripcionByIdUseCase implements IGetAdscripcionByIdUseCase {
  constructor(
    private readonly adscripcionRepository: IAdscripcionRepository,
    private readonly logger: ILogger
  ) {}

  async execute(id: string): Promise<Adscripcion> {
    this.logger.debug('Ejecutando caso de uso: Obtener adscripción por ID', {
      adscripcionId: id,
    });

    const adscripcion = await this.adscripcionRepository.findById(id);

    if (!adscripcion) {
      this.logger.warn('Intento de obtener adscripción inexistente', {
        adscripcionId: id,
      });
      throw new AdscripcionNotFoundError(id);
    }

    this.logger.debug('Adscripción obtenida exitosamente', {
      adscripcionId: id,
      nombre: adscripcion.nombre,
    });

    return adscripcion;
  }
}
