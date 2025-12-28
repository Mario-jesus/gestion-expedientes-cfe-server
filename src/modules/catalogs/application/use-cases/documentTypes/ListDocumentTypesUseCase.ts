import { ILogger } from '@shared/domain';
import { DocumentType } from '../../../domain/entities/DocumentType';
import { IDocumentTypeRepository } from '../../../domain/ports/output/IDocumentTypeRepository';
import { IListDocumentTypesUseCase } from '../../ports/input/documentTypes/IListDocumentTypesUseCase';
import { ListDocumentTypesDTO } from '../../dto/documentTypes/ListDocumentTypesDTO';

/**
 * Caso de uso para listar tipos de documento con filtros y paginación
 */
export class ListDocumentTypesUseCase implements IListDocumentTypesUseCase {
  constructor(
    private readonly documentTypeRepository: IDocumentTypeRepository,
    private readonly logger: ILogger
  ) {}

  async execute(dto: ListDocumentTypesDTO): Promise<{ documentTypes: DocumentType[]; total: number }> {
    const limit = dto.limit ?? 20;
    const offset = dto.offset ?? 0;
    const sortBy = dto.sortBy ?? 'createdAt';
    const sortOrder = dto.sortOrder ?? 'desc';

    this.logger.debug('Ejecutando caso de uso: Listar tipos de documento', {
      filters: dto.filters,
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    const result = await this.documentTypeRepository.findAll(
      dto.filters,
      limit,
      offset,
      sortBy,
      sortOrder
    );

    this.logger.debug('Tipos de documento listados exitosamente', {
      total: result.total,
      returned: result.documentTypes.length,
      limit,
      offset,
    });

    return result;
  }
}
