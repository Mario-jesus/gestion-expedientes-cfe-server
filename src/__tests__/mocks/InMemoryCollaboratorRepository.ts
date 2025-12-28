/**
 * Mock de CollaboratorRepository para tests
 * Implementa ICollaboratorRepository usando almacenamiento en memoria
 * 
 * Este mock permite ejecutar tests E2E sin necesidad de MongoDB
 */

import { Collaborator } from '@modules/collaborators/domain/entities/Collaborator';
import { ICollaboratorRepository } from '@modules/collaborators/domain/ports/output/ICollaboratorRepository';
import { CollaboratorNotFoundError } from '@modules/collaborators/domain/exceptions/CollaboratorNotFoundError';
import { DuplicateCollaboratorError } from '@modules/collaborators/domain/exceptions/DuplicateCollaboratorError';
import { ILogger } from '@shared/domain';

export class InMemoryCollaboratorRepository implements ICollaboratorRepository {
  private collaborators: Map<string, Collaborator> = new Map();
  private collaboratorsByRPE: Map<string, string> = new Map(); // rpe -> collaboratorId

  constructor(private readonly logger: ILogger) {}

  async findById(id: string): Promise<Collaborator | null> {
    return this.collaborators.get(id) || null;
  }

  async findByRPE(rpe: string): Promise<Collaborator | null> {
    const collaboratorId = this.collaboratorsByRPE.get(rpe.toUpperCase().trim());
    if (!collaboratorId) {
      return null;
    }
    return this.collaborators.get(collaboratorId) || null;
  }

  async save(collaborator: Collaborator): Promise<Collaborator> {
    const existing = await this.findById(collaborator.id);
    if (existing) {
      return this.update(collaborator);
    }
    return this.create(collaborator);
  }

  async create(collaborator: Collaborator): Promise<Collaborator> {
    // Verificar que el RPE no exista
    const existingByRPE = await this.findByRPE(collaborator.rpeValue);
    if (existingByRPE && existingByRPE.id !== collaborator.id) {
      throw new DuplicateCollaboratorError(collaborator.rpeValue);
    }

    // Guardar colaborador
    this.collaborators.set(collaborator.id, collaborator);
    this.collaboratorsByRPE.set(collaborator.rpeValue.toUpperCase().trim(), collaborator.id);

    this.logger.debug('Colaborador creado en memoria', {
      collaboratorId: collaborator.id,
      rpe: collaborator.rpeValue,
    });

    return collaborator;
  }

  async update(collaborator: Collaborator): Promise<Collaborator> {
    const existing = await this.findById(collaborator.id);
    if (!existing) {
      throw new CollaboratorNotFoundError(collaborator.id);
    }

    // Verificar que el RPE no esté en uso por otro colaborador
    const existingByRPE = await this.findByRPE(collaborator.rpeValue);
    if (existingByRPE && existingByRPE.id !== collaborator.id) {
      throw new DuplicateCollaboratorError(collaborator.rpeValue);
    }

    // Actualizar índice si el RPE cambió
    if (existing.rpeValue !== collaborator.rpeValue) {
      this.collaboratorsByRPE.delete(existing.rpeValue.toUpperCase().trim());
      this.collaboratorsByRPE.set(collaborator.rpeValue.toUpperCase().trim(), collaborator.id);
    }

    // Actualizar colaborador
    this.collaborators.set(collaborator.id, collaborator);

    this.logger.debug('Colaborador actualizado en memoria', {
      collaboratorId: collaborator.id,
      rpe: collaborator.rpeValue,
    });

    return collaborator;
  }

  async delete(id: string): Promise<boolean> {
    const collaborator = await this.findById(id);
    if (!collaborator) {
      return false;
    }

    // Marcar como inactivo (baja lógica)
    const inactiveCollaborator = Collaborator.fromPersistence(
      {
        nombre: collaborator.nombre,
        apellidos: collaborator.apellidos,
        rpe: collaborator.rpeValue,
        rtt: collaborator.rtt,
        areaId: collaborator.areaId,
        adscripcionId: collaborator.adscripcionId,
        puestoId: collaborator.puestoId,
        tipoContrato: collaborator.tipoContrato,
        rfc: collaborator.rfcValue,
        curp: collaborator.curpValue,
        imss: collaborator.imssValue,
        isActive: false,
        createdBy: collaborator.createdBy,
      },
      collaborator.id,
      collaborator.createdAt,
      collaborator.updatedAt
    );

    this.collaborators.set(id, inactiveCollaborator);

    this.logger.debug('Colaborador eliminado (baja lógica) en memoria', {
      collaboratorId: id,
    });

    return true;
  }

  async findAll(
    filters?: {
      areaId?: string;
      adscripcionId?: string;
      puestoId?: string;
      tipoContrato?: string;
      isActive?: boolean;
      search?: string;
      estadoExpediente?: 'completo' | 'incompleto' | 'sin_documentos';
    },
    limit: number = 20,
    offset: number = 0,
    sortBy: 'nombre' | 'rpe' | 'createdAt' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ collaborators: Collaborator[]; total: number }> {
    let filteredCollaborators = Array.from(this.collaborators.values());

    // Aplicar filtros
    if (filters?.areaId) {
      filteredCollaborators = filteredCollaborators.filter(
        (c) => c.areaId === filters.areaId
      );
    }

    if (filters?.adscripcionId) {
      filteredCollaborators = filteredCollaborators.filter(
        (c) => c.adscripcionId === filters.adscripcionId
      );
    }

    if (filters?.puestoId) {
      filteredCollaborators = filteredCollaborators.filter(
        (c) => c.puestoId === filters.puestoId
      );
    }

    if (filters?.tipoContrato) {
      filteredCollaborators = filteredCollaborators.filter(
        (c) => c.tipoContrato === filters.tipoContrato
      );
    }

    if (filters?.isActive !== undefined) {
      filteredCollaborators = filteredCollaborators.filter(
        (c) => c.isActive === filters.isActive
      );
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredCollaborators = filteredCollaborators.filter(
        (c) =>
          c.nombre.toLowerCase().includes(searchLower) ||
          c.apellidos.toLowerCase().includes(searchLower) ||
          c.rpeValue.toLowerCase().includes(searchLower)
      );
    }

    // Nota: El filtro estadoExpediente se maneja en ListCollaboratorsUseCase
    // No lo implementamos aquí en el mock

    // Ordenar
    filteredCollaborators.sort((a, b) => {
      if (sortBy === 'nombre') {
        const aName = `${a.nombre} ${a.apellidos}`.toLowerCase();
        const bName = `${b.nombre} ${b.apellidos}`.toLowerCase();
        const comparison = aName.localeCompare(bName);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else if (sortBy === 'rpe') {
        const comparison = a.rpeValue.localeCompare(b.rpeValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        // createdAt
        const aDate = a.createdAt?.getTime() || 0;
        const bDate = b.createdAt?.getTime() || 0;
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
    });

    const total = filteredCollaborators.length;

    // Aplicar paginación
    const paginatedCollaborators = filteredCollaborators.slice(offset, offset + limit);

    return {
      collaborators: paginatedCollaborators,
      total,
    };
  }

  async existsByRPE(rpe: string): Promise<boolean> {
    const collaborator = await this.findByRPE(rpe);
    return collaborator !== null;
  }

  async findByAreaId(areaId: string, isActive?: boolean): Promise<Collaborator[]> {
    let collaborators = Array.from(this.collaborators.values()).filter(
      (c) => c.areaId === areaId
    );

    if (isActive !== undefined) {
      collaborators = collaborators.filter((c) => c.isActive === isActive);
    }

    return collaborators;
  }

  async findByAdscripcionId(
    adscripcionId: string,
    isActive?: boolean
  ): Promise<Collaborator[]> {
    let collaborators = Array.from(this.collaborators.values()).filter(
      (c) => c.adscripcionId === adscripcionId
    );

    if (isActive !== undefined) {
      collaborators = collaborators.filter((c) => c.isActive === isActive);
    }

    return collaborators;
  }

  async findByPuestoId(puestoId: string, isActive?: boolean): Promise<Collaborator[]> {
    let collaborators = Array.from(this.collaborators.values()).filter(
      (c) => c.puestoId === puestoId
    );

    if (isActive !== undefined) {
      collaborators = collaborators.filter((c) => c.isActive === isActive);
    }

    return collaborators;
  }

  /**
   * Limpia todos los colaboradores (útil para tests)
   */
  clear(): void {
    this.collaborators.clear();
    this.collaboratorsByRPE.clear();
  }
}
