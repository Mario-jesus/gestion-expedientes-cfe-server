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
  private adscripcionesByNombre: Map<string, string> = new Map(); // "nombre" -> adscripcionId (para búsquedas)
  private adscripcionesByAdscripcion: Map<string, string> = new Map(); // "adscripcion" -> adscripcionId (único)

  constructor(private readonly logger: ILogger) {}

  async findById(id: string): Promise<Adscripcion | null> {
    return this.adscripciones.get(id) || null;
  }

  async findByNombre(nombre: string): Promise<Adscripcion | null> {
    const key = nombre.trim().toLowerCase();
    const adscripcionId = this.adscripcionesByNombre.get(key);
    if (!adscripcionId) {
      return null;
    }
    return this.adscripciones.get(adscripcionId) || null;
  }

  async findByAdscripcion(adscripcion: string): Promise<Adscripcion | null> {
    const key = adscripcion.trim().toLowerCase();
    const adscripcionId = this.adscripcionesByAdscripcion.get(key);
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
    // Verificar que el valor de adscripcion no exista (único)
    const existing = await this.findByAdscripcion(adscripcion.adscripcion);
    if (existing && existing.id !== adscripcion.id) {
      throw new DuplicateAdscripcionError(adscripcion.adscripcion);
    }

    // Guardar adscripción
    this.adscripciones.set(adscripcion.id, adscripcion);
    // Índices (nombre puede duplicarse, adscripcion no)
    this.adscripcionesByNombre.set(
      adscripcion.nombre.trim().toLowerCase(),
      adscripcion.id
    );
    this.adscripcionesByAdscripcion.set(
      adscripcion.adscripcion.trim().toLowerCase(),
      adscripcion.id
    );

    this.logger.debug('Adscripción creada en memoria', {
      adscripcionId: adscripcion.id,
      nombre: adscripcion.nombre,
      adscripcion: adscripcion.adscripcion,
    });

    return adscripcion;
  }

  async update(adscripcion: Adscripcion): Promise<Adscripcion> {
    const existing = await this.findById(adscripcion.id);
    if (!existing) {
      throw new AdscripcionNotFoundError(adscripcion.id);
    }

    // Verificar que el valor de adscripcion no esté en uso por otra adscripción (único)
    if (adscripcion.adscripcion !== existing.adscripcion) {
      const existingByAdscripcion = await this.findByAdscripcion(adscripcion.adscripcion);
      if (existingByAdscripcion && existingByAdscripcion.id !== adscripcion.id) {
        throw new DuplicateAdscripcionError(adscripcion.adscripcion);
      }
    }

    // Actualizar índices si cambiaron
    const oldNombreKey = existing.nombre.trim().toLowerCase();
    const newNombreKey = adscripcion.nombre.trim().toLowerCase();
    if (oldNombreKey !== newNombreKey) {
      this.adscripcionesByNombre.delete(oldNombreKey);
      this.adscripcionesByNombre.set(newNombreKey, adscripcion.id);
    }

    const oldAdscripcionKey = existing.adscripcion.trim().toLowerCase();
    const newAdscripcionKey = adscripcion.adscripcion.trim().toLowerCase();
    if (oldAdscripcionKey !== newAdscripcionKey) {
      this.adscripcionesByAdscripcion.delete(oldAdscripcionKey);
      this.adscripcionesByAdscripcion.set(newAdscripcionKey, adscripcion.id);
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
        adscripcion: adscripcion.adscripcion,
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
    if (filters?.isActive !== undefined) {
      filteredAdscripciones = filteredAdscripciones.filter(
        (a) => a.isActive === filters.isActive
      );
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredAdscripciones = filteredAdscripciones.filter((a) =>
        a.nombre.toLowerCase().includes(searchLower) ||
        a.adscripcion.toLowerCase().includes(searchLower)
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

  async existsByNombre(nombre: string): Promise<boolean> {
    const adscripcion = await this.findByNombre(nombre);
    return adscripcion !== null;
  }

  async existsByAdscripcion(adscripcion: string): Promise<boolean> {
    const found = await this.findByAdscripcion(adscripcion);
    return found !== null;
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
    this.adscripcionesByNombre.clear();
    this.adscripcionesByAdscripcion.clear();
  }
}
