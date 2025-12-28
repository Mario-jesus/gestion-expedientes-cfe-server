/**
 * Mock de MinuteRepository para tests
 * Implementa IMinuteRepository usando almacenamiento en memoria
 * 
 * Este mock permite ejecutar tests E2E sin necesidad de MongoDB
 */

import { Minute } from '@modules/minutes/domain/entities/Minute';
import { IMinuteRepository } from '@modules/minutes/domain/ports/output/IMinuteRepository';
import { MinuteNotFoundError } from '@modules/minutes/domain/exceptions/MinuteNotFoundError';
import { MinuteType } from '@modules/minutes/domain/enums/MinuteType';
import { ILogger } from '@shared/domain';

export class InMemoryMinuteRepository implements IMinuteRepository {
  private minutes: Map<string, Minute> = new Map();
  private minutesByType: Map<MinuteType, string[]> = new Map(); // tipo -> minuteIds[]

  constructor(private readonly logger: ILogger) {}

  async findById(id: string): Promise<Minute | null> {
    return this.minutes.get(id) || null;
  }

  async save(minute: Minute): Promise<Minute> {
    const existing = await this.findById(minute.id);
    if (existing) {
      return this.update(minute);
    }
    return this.create(minute);
  }

  async create(minute: Minute): Promise<Minute> {
    // Guardar minuta
    this.minutes.set(minute.id, minute);

    // Actualizar índice por tipo
    const typeMinutes = this.minutesByType.get(minute.tipo) || [];
    if (!typeMinutes.includes(minute.id)) {
      typeMinutes.push(minute.id);
      this.minutesByType.set(minute.tipo, typeMinutes);
    }

    this.logger.debug('Minuta creada en memoria', {
      minuteId: minute.id,
      tipo: minute.tipo,
      titulo: minute.titulo,
    });

    return minute;
  }

  async update(minute: Minute): Promise<Minute> {
    const existing = await this.findById(minute.id);
    if (!existing) {
      throw new MinuteNotFoundError(minute.id);
    }

    // Actualizar minuta
    this.minutes.set(minute.id, minute);

    // Si el tipo cambió, actualizar índices
    if (existing.tipo !== minute.tipo) {
      // Remover del índice anterior
      const oldTypeMinutes = this.minutesByType.get(existing.tipo) || [];
      const filteredOld = oldTypeMinutes.filter((id) => id !== minute.id);
      this.minutesByType.set(existing.tipo, filteredOld);

      // Agregar al nuevo índice
      const newTypeMinutes = this.minutesByType.get(minute.tipo) || [];
      if (!newTypeMinutes.includes(minute.id)) {
        newTypeMinutes.push(minute.id);
        this.minutesByType.set(minute.tipo, newTypeMinutes);
      }
    }

    this.logger.debug('Minuta actualizada en memoria', {
      minuteId: minute.id,
      tipo: minute.tipo,
    });

    return minute;
  }

  async delete(id: string): Promise<boolean> {
    const minute = await this.findById(id);
    if (!minute) {
      return false;
    }

    // Marcar como inactivo (baja lógica)
    const inactiveMinute = Minute.fromPersistence(
      {
        titulo: minute.titulo,
        tipo: minute.tipo,
        descripcion: minute.descripcion,
        fecha: minute.fecha,
        fileName: minute.fileName,
        fileUrl: minute.fileUrl,
        fileSize: minute.fileSize,
        fileType: minute.fileType,
        uploadedBy: minute.uploadedBy,
        uploadedAt: minute.uploadedAt,
        isActive: false,
      },
      minute.id,
      minute.createdAt,
      minute.updatedAt
    );

    this.minutes.set(id, inactiveMinute);

    this.logger.debug('Minuta eliminada (baja lógica) en memoria', {
      minuteId: id,
    });

    return true;
  }

  async findAll(
    filters?: {
      tipo?: MinuteType;
      isActive?: boolean;
      fechaDesde?: Date;
      fechaHasta?: Date;
      search?: string;
    },
    limit: number = 20,
    offset: number = 0
  ): Promise<{ minutes: Minute[]; total: number }> {
    let filteredMinutes = Array.from(this.minutes.values());

    // Aplicar filtros
    if (filters?.tipo) {
      filteredMinutes = filteredMinutes.filter(
        (minute) => minute.tipo === filters.tipo
      );
    }

    if (filters?.isActive !== undefined) {
      filteredMinutes = filteredMinutes.filter(
        (minute) => minute.isActive === filters.isActive
      );
    }

    if (filters?.fechaDesde) {
      filteredMinutes = filteredMinutes.filter(
        (minute) => minute.fecha >= filters.fechaDesde!
      );
    }

    if (filters?.fechaHasta) {
      filteredMinutes = filteredMinutes.filter(
        (minute) => minute.fecha <= filters.fechaHasta!
      );
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredMinutes = filteredMinutes.filter(
        (minute) =>
          minute.titulo.toLowerCase().includes(searchLower) ||
          (minute.descripcion &&
            minute.descripcion.toLowerCase().includes(searchLower))
      );
    }

    // Ordenar por fecha del evento (más recientes primero)
    filteredMinutes.sort((a, b) => {
      const aDate = a.fecha.getTime();
      const bDate = b.fecha.getTime();
      return bDate - aDate;
    });

    const total = filteredMinutes.length;

    // Aplicar paginación
    const paginatedMinutes = filteredMinutes.slice(offset, offset + limit);

    return {
      minutes: paginatedMinutes,
      total,
    };
  }

  async findByType(
    tipo: MinuteType,
    isActive: boolean = true
  ): Promise<Minute[]> {
    const minuteIds = this.minutesByType.get(tipo) || [];
    let minutes = minuteIds
      .map((id) => this.minutes.get(id))
      .filter((minute): minute is Minute => minute !== undefined);

    // Filtrar por estado activo
    if (isActive !== undefined) {
      minutes = minutes.filter((minute) => minute.isActive === isActive);
    }

    // Ordenar por fecha del evento (más recientes primero)
    minutes.sort((a, b) => {
      const aDate = a.fecha.getTime();
      const bDate = b.fecha.getTime();
      return bDate - aDate;
    });

    return minutes;
  }

  async findByDateRange(
    fechaDesde: Date,
    fechaHasta: Date,
    isActive: boolean = true
  ): Promise<Minute[]> {
    let minutes = Array.from(this.minutes.values());

    // Filtrar por rango de fechas
    minutes = minutes.filter(
      (minute) => minute.fecha >= fechaDesde && minute.fecha <= fechaHasta
    );

    // Filtrar por estado activo
    if (isActive !== undefined) {
      minutes = minutes.filter((minute) => minute.isActive === isActive);
    }

    // Ordenar por fecha del evento (más recientes primero)
    minutes.sort((a, b) => {
      const aDate = a.fecha.getTime();
      const bDate = b.fecha.getTime();
      return bDate - aDate;
    });

    return minutes;
  }

  async searchByText(
    search: string,
    isActive: boolean = true
  ): Promise<Minute[]> {
    const searchLower = search.toLowerCase();
    let minutes = Array.from(this.minutes.values());

    // Filtrar por búsqueda de texto
    minutes = minutes.filter(
      (minute) =>
        minute.titulo.toLowerCase().includes(searchLower) ||
        (minute.descripcion &&
          minute.descripcion.toLowerCase().includes(searchLower))
    );

    // Filtrar por estado activo
    if (isActive !== undefined) {
      minutes = minutes.filter((minute) => minute.isActive === isActive);
    }

    // Ordenar por fecha del evento (más recientes primero)
    minutes.sort((a, b) => {
      const aDate = a.fecha.getTime();
      const bDate = b.fecha.getTime();
      return bDate - aDate;
    });

    return minutes;
  }

  /**
   * Limpia todas las minutas (útil para tests)
   */
  clear(): void {
    this.minutes.clear();
    this.minutesByType.clear();
  }
}
