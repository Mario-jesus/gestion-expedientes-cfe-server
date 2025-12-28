import { ILogger } from '@shared/domain';
import { Collaborator } from '../../domain';
import { ICollaboratorRepository } from '../../domain/ports/output/ICollaboratorRepository';
import { IListCollaboratorsUseCase } from '../ports/input/IListCollaboratorsUseCase';
import { ListCollaboratorsDTO } from '../dto/ListCollaboratorsDTO';
import { IDocumentRepository } from '@modules/documents/domain/ports/output/IDocumentRepository';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';

/**
 * Caso de uso para listar colaboradores con filtros y paginación
 * 
 * Se encarga de:
 * - Aplicar filtros opcionales (área, adscripción, puesto, tipo de contrato, estado, búsqueda)
 * - Aplicar filtro por estado de expediente (completo/incompleto/sin_documentos)
 * - Aplicar paginación (limit, offset)
 * - Aplicar ordenamiento
 * - Retornar lista de colaboradores y total de resultados
 */
export class ListCollaboratorsUseCase implements IListCollaboratorsUseCase {
  constructor(
    private readonly collaboratorRepository: ICollaboratorRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Calcula el estado del expediente de un colaborador
   * 
   * Un expediente completo requiere al menos:
   * - BATERIA (1 documento único)
   * - PERFIL (1 documento único)
   * 
   * Estados:
   * - 'sin_documentos': No tiene ningún documento activo
   * - 'incompleto': Tiene algunos documentos pero no tiene BATERIA o PERFIL
   * - 'completo': Tiene al menos BATERIA y PERFIL
   */
  private async calculateEstadoExpediente(collaboratorId: string): Promise<'completo' | 'incompleto' | 'sin_documentos'> {
    try {
      // Obtener todos los documentos activos del colaborador
      const documents = await this.documentRepository.findByCollaboratorId(collaboratorId, {
        isActive: true,
      });

      // Si no tiene documentos
      if (documents.length === 0) {
        return 'sin_documentos';
      }

      // Verificar si tiene BATERIA y PERFIL (documentos únicos requeridos)
      const hasBateria = documents.some((doc) => doc.kind === DocumentKind.BATERIA);
      const hasPerfil = documents.some((doc) => doc.kind === DocumentKind.PERFIL);

      // Expediente completo si tiene BATERIA y PERFIL
      if (hasBateria && hasPerfil) {
        return 'completo';
      }

      // Si tiene documentos pero no tiene BATERIA o PERFIL, está incompleto
      return 'incompleto';
    } catch (error) {
      this.logger.error('Error calculando estado de expediente', error instanceof Error ? error : new Error(String(error)), {
        collaboratorId,
      });
      // En caso de error, asumir incompleto para no filtrar incorrectamente
      return 'incompleto';
    }
  }

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con filtros y parámetros de paginación
   * @returns Lista de colaboradores y total de resultados
   */
  async execute(dto: ListCollaboratorsDTO): Promise<{ collaborators: Collaborator[]; total: number }> {
    const limit = dto.limit ?? 20; // Default: 20
    const offset = dto.offset ?? 0; // Default: 0
    const sortBy = dto.sortBy ?? 'createdAt'; // Default: createdAt
    const sortOrder = dto.sortOrder ?? 'desc'; // Default: desc

    this.logger.debug('Ejecutando caso de uso: Listar colaboradores', {
      filters: dto.filters,
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    // Si hay filtro por estadoExpediente, necesitamos calcularlo después de obtener los colaboradores
    const estadoExpedienteFilter = dto.filters?.estadoExpediente;

    // Crear filtros sin estadoExpediente para la consulta inicial
    const filtersWithoutEstado = { ...dto.filters };
    delete filtersWithoutEstado.estadoExpediente;

    // Obtener colaboradores sin el filtro de estadoExpediente
    // Si hay filtro de estadoExpediente, necesitamos obtener más resultados para filtrar después
    // (obtenemos un número mayor para tener suficientes resultados después del filtro)
    const result = await this.collaboratorRepository.findAll(
      Object.keys(filtersWithoutEstado).length > 0 ? filtersWithoutEstado : undefined,
      estadoExpedienteFilter ? 1000 : limit, // Obtener más si hay filtro de estado para tener suficientes resultados
      estadoExpedienteFilter ? 0 : offset, // Si hay filtro, empezar desde 0 para obtener todos
      sortBy,
      sortOrder
    );

    let filteredCollaborators = result.collaborators;
    let filteredTotal = result.total;

    // Si hay filtro por estadoExpediente, calcular y filtrar
    if (estadoExpedienteFilter) {
      this.logger.debug('Aplicando filtro por estado de expediente', {
        estadoExpediente: estadoExpedienteFilter,
        totalCollaborators: result.collaborators.length,
      });

      // Calcular estado de expediente para cada colaborador
      const collaboratorsWithEstado = await Promise.all(
        result.collaborators.map(async (collaborator) => {
          const estado = await this.calculateEstadoExpediente(collaborator.id);
          return { collaborator, estado };
        })
      );

      // Filtrar por el estado solicitado
      filteredCollaborators = collaboratorsWithEstado
        .filter((item) => item.estado === estadoExpedienteFilter)
        .map((item) => item.collaborator);

      // Aplicar paginación después del filtro
      const paginatedCollaborators = filteredCollaborators.slice(offset, offset + limit);
      filteredTotal = filteredCollaborators.length;

      this.logger.debug('Filtro por estado de expediente aplicado', {
        estadoExpediente: estadoExpedienteFilter,
        totalAntes: result.collaborators.length,
        totalDespues: filteredTotal,
        retornados: paginatedCollaborators.length,
      });

      return {
        collaborators: paginatedCollaborators,
        total: filteredTotal,
      };
    }

    this.logger.debug('Colaboradores listados exitosamente', {
      total: filteredTotal,
      returned: filteredCollaborators.length,
      limit,
      offset,
    });

    return {
      collaborators: filteredCollaborators,
      total: filteredTotal,
    };
  }
}
