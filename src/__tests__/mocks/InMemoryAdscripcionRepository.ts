/**
 * Mock de AdscripcionRepository para tests
 * Implementa IAdscripcionRepository usando almacenamiento en memoria
 * 
 * Este mock permite ejecutar tests E2E sin necesidad de MongoDB
 */

import { Adscripcion } from '@modules/catalogs/domain/entities/Adscripcion';
import { IAdscripcionRepository } from '@modules/catalogs/domain/ports/output/IAdscripcionRepository';
import { AdscripcionNotFoundError } from '@modules/catalogs/domain/exceptions/AdscripcionNotFoundError';
import { DuplicateAdscripcionError } from '@modules/catalogs/domain/exceptions/DuplicateAdscripcionError';
import { ILogger } from '@shared/domain';

export class InMemoryAdscripcionRepository implements IAdscripcionRepository {
  private adscripciones: Map<string, Adscripcion> = new Map();
  private adscripcionesByNombreAndArea: Map<string, string> = new Map(); // "nombre|areaId" -> adscripcionId

  constructor(private readonly logger: ILogger) {}

  private getKey(nombre: string, areaId: string): string {
    return `${nombre.trim().toLowerCase()}|${areaId}`;
  }

  async findById(id: string): Promise<Adscripcion | null> {
    return this.adscripciones.get(id) || null;
  }

  async findByNombreAndAreaId(nombre: string, areaId: string): Promise<Adscripcion | null> {
    const key = this.getKey(nombre, areaId);
    const adscripcionId = this.adscripcionesByNombreAndArea.get(key);
    if (!adscripcionId) {
      return null;
    }
    return this.adscripciones.get(adscripcionId) || null;
  }

  async save(adscripcion: Adscripcion): Promise<Adscripcion> {
    const existing = await this.findById(adscripcion.id);
    if (existing) {
      return this.update(adscripcion);
    }
    return this.create(adscripcion);
  }

  async create(adscripcion: Adscripcion): Promise<Adscripcion> {
    // Verificar que el nombre no exista en el área
    const existing = await this.findByNombreAndAreaId(adscripcion.nombre, adscripcion.areaId);
    if (existing && existing.id !== adscripcion.id) {
      throw new DuplicateAdscripcionError(adscripcion.nombre, adscripcion.areaId);
    }

    // Guardar adscripción
    this.adscripciones.set(adscripcion.id, adscripcion);
    this.adscripcionesByNombreAndArea.set(
      this.getKey(adscripcion.nombre, adscripcion.areaId),
      adscripcion.id
    );

    this.logger.debug('Adscripción creada en memoria', {
      adscripcionId: adscripcion.id,
      nombre: adscripcion.nombre,
      areaId: adscripcion.areaId,
    });

    return adscripcion;
  }

  async update(adscripcion: Adscripcion): Promise<Adscripcion> {
    const existing = await this.findById(adscripcion.id);
    if (!existing) {
      throw new AdscripcionNotFoundError(adscripcion.id);
    }

    // Verificar que el nombre no esté en uso por otra adscripción en el mismo área
    const existingByNombre = await this.findByNombreAndAreaId(
      adscripcion.nombre,
      adscripcion.areaId
    );
    if (existingByNombre && existingByNombre.id !== adscripcion.id) {
      throw new DuplicateAdscripcionError(adscripcion.nombre, adscripcion.areaId);
    }

    // Actualizar índice si el nombre o área cambiaron
    const oldKey = this.getKey(existing.nombre, existing.areaId);
    const newKey = this.getKey(adscripcion.nombre, adscripcion.areaId);
    if (oldKey !== newKey) {
      this.adscripcionesByNombreAndArea.delete(oldKey);
      this.adscripcionesByNombreAndArea.set(newKey, adscripcion.id);
    }

    // Actualizar adscripción
    this.adscripciones.set(adscripcion.id, adscripcion);

    this.logger.debug('Adscripción actualizada en memoria', {
      adscripcionId: adscripcion.id,
      nombre: adscripcion.nombre,
    });

    return adscripcion;
  }

  async delete(id: string): Promise<boolean> {
    const adscripcion = await this.findById(id);
    if (!adscripcion) {
      return false;
    }

    // Marcar como inactivo (baja lógica)
    const inactiveAdscripcion = Adscripcion.fromPersistence(
      {
        nombre: adscripcion.nombre,
        areaId: adscripcion.areaId,
        descripcion: adscripcion.descripcion,
        isActive: false,
      },
      adscripcion.id,
      adscripcion.createdAt,
      adscripcion.updatedAt
    );

    this.adscripciones.set(id, inactiveAdscripcion);

    this.logger.debug('Adscripción eliminada (baja lógica) en memoria', {
      adscripcionId: id,
    });

    return true;
  }

  async findAll(
    filters?: {
      areaId?: string;
      isActive?: boolean;
      search?: string;
    },
    limit: number = 20,
    offset: number = 0,
    sortBy: 'nombre' | 'createdAt' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ adscripciones: Adscripcion[]; total: number }> {
    let filteredAdscripciones = Array.from(this.adscripciones.values());

    // Aplicar filtros
    if (filters?.areaId) {
      filteredAdscripciones = filteredAdscripciones.filter(
        (a) => a.areaId === filters.areaId
      );
    }

    if (filters?.isActive !== undefined) {
      filteredAdscripciones = filteredAdscripciones.filter(
        (a) => a.isActive === filters.isActive
      );
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredAdscripciones = filteredAdscripciones.filter((a) =>
        a.nombre.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar
    filteredAdscripciones.sort((a, b) => {
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

    const total = filteredAdscripciones.length;

    // Aplicar paginación
    const paginatedAdscripciones = filteredAdscripciones.slice(offset, offset + limit);

    return {
      adscripciones: paginatedAdscripciones,
      total,
    };
  }

  async existsByNombreAndAreaId(nombre: string, areaId: string): Promise<boolean> {
    const adscripcion = await this.findByNombreAndAreaId(nombre, areaId);
    return adscripcion !== null;
  }

  async findByAreaId(areaId: string, isActive?: boolean): Promise<Adscripcion[]> {
    let adscripciones = Array.from(this.adscripciones.values()).filter(
      (a) => a.areaId === areaId
    );

    if (isActive !== undefined) {
      adscripciones = adscripciones.filter((a) => a.isActive === isActive);
    }

    return adscripciones;
  }

  async countCollaboratorsByAdscripcionId(
    _adscripcionId: string,
    _isActive?: boolean
  ): Promise<number> {
    // En un mock real, esto debería consultar el repositorio de colaboradores
    // Por ahora retornamos 0 ya que es solo para tests
    return 0;
  }

  /**
   * Limpia todas las adscripciones (útil para tests)
   */
  clear(): void {
    this.adscripciones.clear();
    this.adscripcionesByNombreAndArea.clear();
  }
}
