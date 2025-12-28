import { ILogger } from '@shared/domain';
import { CollaboratorDocument } from '../../domain';
import { IDocumentRepository } from '../../domain/ports/output/IDocumentRepository';
import { IListDocumentsUseCase } from '../ports/input/IListDocumentsUseCase';
import { ListDocumentsFiltersDTO } from '../dto/ListDocumentsFiltersDTO';

/**
 * Caso de uso para listar documentos con filtros y paginación
 * 
 * Se encarga de:
 * - Aplicar filtros opcionales (collaboratorId, kind, isActive, documentTypeId)
 * - Aplicar paginación (limit, offset)
 * - Retornar lista de documentos y total de resultados
 */
export class ListDocumentsUseCase implements IListDocumentsUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con filtros y parámetros de paginación
   * @returns Lista de documentos y total de resultados
   */
  async execute(dto: ListDocumentsFiltersDTO): Promise<{ documents: CollaboratorDocument[]; total: number }> {
    const limit = dto.limit ?? 20; // Default: 20
    const offset = dto.offset ?? 0; // Default: 0

    this.logger.debug('Ejecutando caso de uso: Listar documentos', {
      filters: {
        collaboratorId: dto.collaboratorId,
        kind: dto.kind,
        isActive: dto.isActive,
        documentTypeId: dto.documentTypeId,
      },
      limit,
      offset,
    });

    // Aplicar filtros y paginación
    const filters: {
      collaboratorId?: string;
      kind?: typeof dto.kind;
      isActive?: boolean;
      documentTypeId?: string;
    } = {};

    if (dto.collaboratorId !== undefined) {
      filters.collaboratorId = dto.collaboratorId;
    }
    if (dto.kind !== undefined) {
      filters.kind = dto.kind;
    }
    if (dto.isActive !== undefined) {
      filters.isActive = dto.isActive;
    }
    if (dto.documentTypeId !== undefined) {
      filters.documentTypeId = dto.documentTypeId;
    }

    const result = await this.documentRepository.findAll(filters, limit, offset);

    this.logger.debug('Documentos listados exitosamente', {
      total: result.total,
      returned: result.documents.length,
      limit,
      offset,
    });

    return result;
  }
}
