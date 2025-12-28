import { IEventBus, ILogger } from '@shared/domain';
import { Collaborator } from '../../domain';
import { DuplicateCollaboratorError } from '../../domain/exceptions/DuplicateCollaboratorError';
import { CollaboratorCreated } from '../../domain/events/CollaboratorCreated';
import { ICollaboratorRepository } from '../../domain/ports/output/ICollaboratorRepository';
import { ICreateCollaboratorUseCase } from '../ports/input/ICreateCollaboratorUseCase';
import { CreateCollaboratorDTO } from '../dto/CreateCollaboratorDTO';

/**
 * Caso de uso para crear un nuevo colaborador
 * 
 * Se encarga de:
 * - Validar que el RPE no exista
 * - Crear la entidad Collaborator con los value objects correctos
 * - Persistir el colaborador
 * - Publicar eventos de dominio (CollaboratorCreated)
 */
export class CreateCollaboratorUseCase implements ICreateCollaboratorUseCase {
  constructor(
    private readonly collaboratorRepository: ICollaboratorRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con los datos del colaborador a crear
   * @param createdBy - ID del usuario que está creando este colaborador (opcional, para audit)
   * @returns El colaborador creado
   * @throws DuplicateCollaboratorError si el RPE ya existe
   */
  async execute(dto: CreateCollaboratorDTO, createdBy?: string): Promise<Collaborator> {
    this.logger.info('Ejecutando caso de uso: Crear colaborador', {
      rpe: dto.rpe,
      nombre: dto.nombre,
      apellidos: dto.apellidos,
      createdBy,
    });

    // Validar que el RPE no exista
    const rpeExists = await this.collaboratorRepository.existsByRPE(dto.rpe);
    if (rpeExists) {
      this.logger.warn('Intento de crear colaborador con RPE duplicado', {
        rpe: dto.rpe,
        createdBy,
      });
      throw new DuplicateCollaboratorError(dto.rpe);
    }

    // Crear la entidad Collaborator
    // El método Collaborator.create acepta strings y los convierte a value objects
    const collaborator = Collaborator.create(
      {
        nombre: dto.nombre,
        apellidos: dto.apellidos,
        rpe: dto.rpe,
        rtt: dto.rtt,
        areaId: dto.areaId,
        adscripcionId: dto.adscripcionId,
        puestoId: dto.puestoId,
        tipoContrato: dto.tipoContrato,
        rfc: dto.rfc,
        curp: dto.curp,
        imss: dto.imss,
        isActive: dto.isActive ?? true, // Default: true
        createdBy,
      }
    );

    // Persistir el colaborador
    const savedCollaborator = await this.collaboratorRepository.create(collaborator);

    // Publicar evento de dominio
    // createdBy se usa como performedBy en el evento
    await this.eventBus.publish(new CollaboratorCreated(savedCollaborator, createdBy));

    this.logger.info('Colaborador creado exitosamente', {
      collaboratorId: savedCollaborator.id,
      rpe: savedCollaborator.rpeValue,
      createdBy,
    });

    return savedCollaborator;
  }
}
