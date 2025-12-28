/**
 * Mock de AreaRepository para tests
 * Implementa IAreaRepository usando almacenamiento en memoria
 * 
 * Este mock permite ejecutar tests E2E sin necesidad de MongoDB
 */

import { Area } from '@modules/catalogs/domain/entities/Area';
import { IAreaRepository } from '@modules/catalogs/domain/ports/output/IAreaRepository';
import { AreaNotFoundError } from '@modules/catalogs/domain/exceptions/AreaNotFoundError';
import { DuplicateAreaError } from '@modules/catalogs/domain/exceptions/DuplicateAreaError';
import { ILogger } from '@shared/domain';

export class InMemoryAreaRepository implements IAreaRepository {
  private areas: Map<string, Area> = new Map();
  private areasByNombre: Map<string, string> = new Map(); // nombre -> areaId

  constructor(private readonly logger: ILogger) {}

  async findById(id: string): Promise<Area | null> {
    return this.areas.get(id) || null;
  }

  async findByNombre(nombre: string): Promise<Area | null> {
    const areaId = this.areasByNombre.get(nombre.trim().toLowerCase());
    if (!areaId) {
      return null;
    }
    return this.areas.get(areaId) || null;
  }

  async save(area: Area): Promise<Area> {
    const existing = await this.findById(area.id);
    if (existing) {
      return this.update(area);
    }
    return this.create(area);
  }

  async create(area: Area): Promise<Area> {
    // Verificar que el nombre no exista
    const existing = await this.findByNombre(area.nombre);
    if (existing && existing.id !== area.id) {
      throw new DuplicateAreaError(area.nombre);
    }

    // Guardar área
    this.areas.set(area.id, area);
    this.areasByNombre.set(area.nombre.trim().toLowerCase(), area.id);

    this.logger.debug('Área creada en memoria', {
      areaId: area.id,
      nombre: area.nombre,
    });

    return area;
  }

  async update(area: Area): Promise<Area> {
    const existing = await this.findById(area.id);
    if (!existing) {
      throw new AreaNotFoundError(area.id);
    }

    // Verificar que el nombre no esté en uso por otra área
    const existingByNombre = await this.findByNombre(area.nombre);
    if (existingByNombre && existingByNombre.id !== area.id) {
      throw new DuplicateAreaError(area.nombre);
    }

    // Actualizar índice si el nombre cambió
    if (existing.nombre !== area.nombre) {
      this.areasByNombre.delete(existing.nombre.trim().toLowerCase());
      this.areasByNombre.set(area.nombre.trim().toLowerCase(), area.id);
    }

    // Actualizar área
    this.areas.set(area.id, area);

    this.logger.debug('Área actualizada en memoria', {
      areaId: area.id,
      nombre: area.nombre,
    });

    return area;
  }

  async delete(id: string): Promise<boolean> {
    const area = await this.findById(id);
    if (!area) {
      return false;
    }

    // Marcar como inactivo (baja lógica)
    const inactiveArea = Area.fromPersistence(
      {
        nombre: area.nombre,
        descripcion: area.descripcion,
        isActive: false,
      },
      area.id,
      area.createdAt,
      area.updatedAt
    );

    this.areas.set(id, inactiveArea);

    this.logger.debug('Área eliminada (baja lógica) en memoria', {
      areaId: id,
    });

    return true;
  }

  async findAll(
    filters?: {
      isActive?: boolean;
      search?: string;
    },
    limit: number = 20,
    offset: number = 0,
    sortBy: 'nombre' | 'createdAt' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ areas: Area[]; total: number }> {
    let filteredAreas = Array.from(this.areas.values());

    // Aplicar filtros
    if (filters?.isActive !== undefined) {
      filteredAreas = filteredAreas.filter((a) => a.isActive === filters.isActive);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredAreas = filteredAreas.filter((a) =>
        a.nombre.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar
    filteredAreas.sort((a, b) => {
      if (sortBy === 'nombre') {
        const comparison = a.nombre.localeCompare(b.nombre);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        // createdAt
        const aDate = a.createdAt?.getTime() || 0;
        const bDate = b.createdAt?.getTime() || 0;
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
    });

    const total = filteredAreas.length;

    // Aplicar paginación
    const paginatedAreas = filteredAreas.slice(offset, offset + limit);

    return {
      areas: paginatedAreas,
      total,
    };
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    const area = await this.findByNombre(nombre);
    return area !== null;
  }

  async countCollaboratorsByAreaId(_areaId: string, _isActive?: boolean): Promise<number> {
    // En un mock real, esto debería consultar el repositorio de colaboradores
    // Por ahora retornamos 0 ya que es solo para tests
    return 0;
  }

  async countActiveAdscripcionesByAreaId(_areaId: string): Promise<number> {
    // En un mock real, esto debería consultar el repositorio de adscripciones
    // Por ahora retornamos 0 ya que es solo para tests
    return 0;
  }

  /**
   * Limpia todas las áreas (útil para tests)
   */
  clear(): void {
    this.areas.clear();
    this.areasByNombre.clear();
  }
}
