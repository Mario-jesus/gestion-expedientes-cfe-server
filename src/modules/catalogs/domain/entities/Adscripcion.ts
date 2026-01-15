import { Entity } from '@shared/domain/entities/Entity';

/**
 * Propiedades requeridas para crear una adscripción
 */
export interface AdscripcionProps {
  nombre: string;
  adscripcion: string;
  descripcion?: string | undefined;
  isActive: boolean;
}

/**
 * Entidad de dominio Adscripcion
 * Representa una adscripción (texto libre definido por el usuario)
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
      adscripcion: string;
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

    const trimmedAdscripcion = props.adscripcion.trim();
    if (!trimmedAdscripcion) {
      throw new Error('La adscripción es requerida');
    }

    const adscripcionProps: AdscripcionProps = {
      nombre: trimmedNombre,
      adscripcion: trimmedAdscripcion,
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
      adscripcion: string;
      descripcion?: string | undefined;
      isActive: boolean;
    },
    id: string,
    createdAt: Date,
    updatedAt: Date
  ): Adscripcion {
    const adscripcionProps: AdscripcionProps = {
      nombre: props.nombre,
      adscripcion: props.adscripcion,
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

  get adscripcion(): string {
    return this.props.adscripcion;
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
   * Actualiza la adscripción
   */
  updateAdscripcion(adscripcion: string): void {
    const trimmedAdscripcion = adscripcion.trim();
    if (!trimmedAdscripcion) {
      throw new Error('La adscripción es requerida');
    }
    this.props.adscripcion = trimmedAdscripcion;
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
    adscripcion: string;
    descripcion?: string | undefined;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      nombre: this.props.nombre,
      adscripcion: this.props.adscripcion,
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
    adscripcion: string;
    descripcion?: string | undefined;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      nombre: this.props.nombre,
      adscripcion: this.props.adscripcion,
      descripcion: this.props.descripcion,
      isActive: this.props.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
