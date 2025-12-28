import { ILogger } from '@shared/domain';
import { Collaborator } from '../../domain';
import { CollaboratorNotFoundError } from '../../domain/exceptions/CollaboratorNotFoundError';
import { ICollaboratorRepository } from '../../domain/ports/output/ICollaboratorRepository';
import { IGetCollaboratorByIdUseCase } from '../ports/input/IGetCollaboratorByIdUseCase';

/**
 * Caso de uso para obtener un colaborador por su ID
 */
export class GetCollaboratorByIdUseCase implements IGetCollaboratorByIdUseCase {
  constructor(
    private readonly collaboratorRepository: ICollaboratorRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID del colaborador a buscar
   * @returns El colaborador encontrado
   * @throws CollaboratorNotFoundError si el colaborador no existe
   */
  async execute(id: string): Promise<Collaborator> {
    this.logger.debug('Ejecutando caso de uso: Obtener colaborador por ID', {
      collaboratorId: id,
    });

    const collaborator = await this.collaboratorRepository.findById(id);

    if (!collaborator) {
      this.logger.warn('Intento de obtener colaborador inexistente', {
        collaboratorId: id,
      });
      throw new CollaboratorNotFoundError(id);
    }

    this.logger.debug('Colaborador obtenido exitosamente', {
      collaboratorId: id,
      rpe: collaborator.rpeValue,
    });

    return collaborator;
  }
}
