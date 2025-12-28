/**
 * Mock de PuestoRepository para tests
 * Implementa IPuestoRepository usando almacenamiento en memoria
 * 
 * Este mock permite ejecutar tests E2E sin necesidad de MongoDB
 */

import { Puesto } from '@modules/catalogs/domain/entities/Puesto';
import { IPuestoRepository } from '@modules/catalogs/domain/ports/output/IPuestoRepository';
import { PuestoNotFoundError } from '@modules/catalogs/domain/exceptions/PuestoNotFoundError';
import { DuplicatePuestoError } from '@modules/catalogs/domain/exceptions/DuplicatePuestoError';
import { ILogger } from '@shared/domain';

export class InMemoryPuestoRepository implements IPuestoRepository {
  private puestos: Map<string, Puesto> = new Map();
  private puestosByNombre: Map<string, string> = new Map(); // nombre -> puestoId

  constructor(private readonly logger: ILogger) {}

  async findById(id: string): Promise<Puesto | null> {
    return this.puestos.get(id) || null;
  }

  async findByNombre(nombre: string): Promise<Puesto | null> {
    const puestoId = this.puestosByNombre.get(nombre.trim().toLowerCase());
    if (!puestoId) {
      return null;
    }
    return this.puestos.get(puestoId) || null;
  }

  async save(puesto: Puesto): Promise<Puesto> {
    const existing = await this.findById(puesto.id);
    if (existing) {
      return this.update(puesto);
    }
    return this.create(puesto);
  }

  async create(puesto: Puesto): Promise<Puesto> {
    // Verificar que el nombre no exista
    const existing = await this.findByNombre(puesto.nombre);
    if (existing && existing.id !== puesto.id) {
      throw new DuplicatePuestoError(puesto.nombre);
    }

    // Guardar puesto
    this.puestos.set(puesto.id, puesto);
    this.puestosByNombre.set(puesto.nombre.trim().toLowerCase(), puesto.id);

    this.logger.debug('Puesto creado en memoria', {
      puestoId: puesto.id,
      nombre: puesto.nombre,
    });

    return puesto;
  }

  async update(puesto: Puesto): Promise<Puesto> {
    const existing = await this.findById(puesto.id);
    if (!existing) {
      throw new PuestoNotFoundError(puesto.id);
    }

    // Verificar que el nombre no esté en uso por otro puesto
    const existingByNombre = await this.findByNombre(puesto.nombre);
    if (existingByNombre && existingByNombre.id !== puesto.id) {
      throw new DuplicatePuestoError(puesto.nombre);
    }

    // Actualizar índice si el nombre cambió
    if (existing.nombre !== puesto.nombre) {
      this.puestosByNombre.delete(existing.nombre.trim().toLowerCase());
      this.puestosByNombre.set(puesto.nombre.trim().toLowerCase(), puesto.id);
    }

    // Actualizar puesto
    this.puestos.set(puesto.id, puesto);

    this.logger.debug('Puesto actualizado en memoria', {
      puestoId: puesto.id,
      nombre: puesto.nombre,
    });

    return puesto;
  }

  async delete(id: string): Promise<boolean> {
    const puesto = await this.findById(id);
    if (!puesto) {
      return false;
    }

    // Marcar como inactivo (baja lógica)
    const inactivePuesto = Puesto.fromPersistence(
      {
        nombre: puesto.nombre,
        descripcion: puesto.descripcion,
        isActive: false,
      },
      puesto.id,
      puesto.createdAt,
      puesto.updatedAt
    );

    this.puestos.set(id, inactivePuesto);

    this.logger.debug('Puesto eliminado (baja lógica) en memoria', {
      puestoId: id,
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
  ): Promise<{ puestos: Puesto[]; total: number }> {
    let filteredPuestos = Array.from(this.puestos.values());

    // Aplicar filtros
    if (filters?.isActive !== undefined) {
      filteredPuestos = filteredPuestos.filter((p) => p.isActive === filters.isActive);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredPuestos = filteredPuestos.filter((p) =>
        p.nombre.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar
    filteredPuestos.sort((a, b) => {
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

    const total = filteredPuestos.length;

    // Aplicar paginación
    const paginatedPuestos = filteredPuestos.slice(offset, offset + limit);

    return {
      puestos: paginatedPuestos,
      total,
    };
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    const puesto = await this.findByNombre(nombre);
    return puesto !== null;
  }

  async countCollaboratorsByPuestoId(_puestoId: string, _isActive?: boolean): Promise<number> {
    // En un mock real, esto debería consultar el repositorio de colaboradores
    // Por ahora retornamos 0 ya que es solo para tests
    return 0;
  }

  /**
   * Limpia todos los puestos (útil para tests)
   */
  clear(): void {
    this.puestos.clear();
    this.puestosByNombre.clear();
  }
}
