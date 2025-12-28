import { Entity } from '@shared/domain/entities/Entity';

/**
 * Propiedades requeridas para crear una adscripción
 */
export interface AdscripcionProps {
  nombre: string;
  areaId: string;
  descripcion?: string | undefined;
  isActive: boolean;
}

/**
 * Entidad de dominio Adscripcion
 * Representa una adscripción específica dentro de un área
 * (ej: Central Hidroeléctrica Manuel Moreno Torres)
 */
export class Adscripcion extends Entity<AdscripcionProps> {
  private constructor(
    props: AdscripcionProps,
    id: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.props = props;
  }

  private props: AdscripcionProps;

  /**
   * Factory method para crear una nueva instancia de Adscripcion
   */
  public static create(
    props: {
      nombre: string;
      areaId: string;
      descripcion?: string | undefined;
      isActive: boolean;
    },
    id?: string
  ): Adscripcion {
    const adscripcionId = id || crypto.randomUUID();

    const trimmedNombre = props.nombre.trim();
    if (!trimmedNombre) {
      throw new Error('El nombre de la adscripción es requerido');
    }

    if (!props.areaId) {
      throw new Error('El areaId es requerido');
    }

    const adscripcionProps: AdscripcionProps = {
      nombre: trimmedNombre,
      areaId: props.areaId,
      descripcion: props.descripcion?.trim() || undefined,
      isActive: props.isActive,
    };

    const adscripcion = new Adscripcion(adscripcionProps, adscripcionId);
    return adscripcion;
  }

  /**
   * Factory method para reconstruir un Adscripcion desde persistencia
   */
  public static fromPersistence(
    props: {
      nombre: string;
      areaId: string;
      descripcion?: string | undefined;
      isActive: boolean;
    },
    id: string,
    createdAt: Date,
    updatedAt: Date
  ): Adscripcion {
    const adscripcionProps: AdscripcionProps = {
      nombre: props.nombre,
      areaId: props.areaId,
      descripcion: props.descripcion || undefined,
      isActive: props.isActive,
    };

    return new Adscripcion(adscripcionProps, id, createdAt, updatedAt);
  }

  // ============================================
  // GETTERS
  // ============================================

  get nombre(): string {
    return this.props.nombre;
  }

  get areaId(): string {
    return this.props.areaId;
  }

  get descripcion(): string | undefined {
    return this.props.descripcion;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  // ============================================
  // MÉTODOS DE NEGOCIO
  // ============================================

  /**
   * Activa la adscripción
   */
  activate(): void {
    if (this.props.isActive) {
      return; // Ya está activo
    }
    this.props.isActive = true;
    this.markAsUpdated();
  }

  /**
   * Desactiva la adscripción (baja lógica)
   */
  deactivate(): void {
    if (!this.props.isActive) {
      return; // Ya está inactivo
    }
    this.props.isActive = false;
    this.markAsUpdated();
  }

  /**
   * Actualiza el nombre de la adscripción
   */
  updateNombre(nombre: string): void {
    const trimmedNombre = nombre.trim();
    if (!trimmedNombre) {
      throw new Error('El nombre de la adscripción es requerido');
    }
    this.props.nombre = trimmedNombre;
    this.markAsUpdated();
  }

  /**
   * Actualiza la descripción de la adscripción
   */
  updateDescripcion(descripcion: string | undefined): void {
    this.props.descripcion = descripcion?.trim() || undefined;
    this.markAsUpdated();
  }

  /**
   * Actualiza el área de la adscripción
   */
  updateAreaId(areaId: string): void {
    if (!areaId) {
      throw new Error('El areaId es requerido');
    }
    this.props.areaId = areaId;
    this.markAsUpdated();
  }

  // ============================================
  // SERIALIZACIÓN
  // ============================================

  /**
   * Obtiene las propiedades de la adscripción (para persistencia)
   */
  toPersistence(): {
    id: string;
    nombre: string;
    areaId: string;
    descripcion?: string | undefined;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      nombre: this.props.nombre,
      areaId: this.props.areaId,
      descripcion: this.props.descripcion,
      isActive: this.props.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Obtiene la representación pública de la adscripción (para API)
   */
  toPublicJSON(): {
    id: string;
    nombre: string;
    areaId: string;
    descripcion?: string | undefined;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      nombre: this.props.nombre,
      areaId: this.props.areaId,
      descripcion: this.props.descripcion,
      isActive: this.props.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
