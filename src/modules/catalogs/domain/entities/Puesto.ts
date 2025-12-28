import { Entity } from '@shared/domain/entities/Entity';

/**
 * Propiedades requeridas para crear un puesto
 */
export interface PuestoProps {
  nombre: string;
  descripcion?: string | undefined;
  isActive: boolean;
}

/**
 * Entidad de dominio Puesto
 * Representa un puesto de trabajo disponible en CFE
 */
export class Puesto extends Entity<PuestoProps> {
  private constructor(
    props: PuestoProps,
    id: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.props = props;
  }

  private props: PuestoProps;

  /**
   * Factory method para crear una nueva instancia de Puesto
   */
  public static create(
    props: {
      nombre: string;
      descripcion?: string | undefined;
      isActive: boolean;
    },
    id?: string
  ): Puesto {
    const puestoId = id || crypto.randomUUID();

    const trimmedNombre = props.nombre.trim();
    if (!trimmedNombre) {
      throw new Error('El nombre del puesto es requerido');
    }

    const puestoProps: PuestoProps = {
      nombre: trimmedNombre,
      descripcion: props.descripcion?.trim() || undefined,
      isActive: props.isActive,
    };

    const puesto = new Puesto(puestoProps, puestoId);
    return puesto;
  }

  /**
   * Factory method para reconstruir un Puesto desde persistencia
   */
  public static fromPersistence(
    props: {
      nombre: string;
      descripcion?: string | undefined;
      isActive: boolean;
    },
    id: string,
    createdAt: Date,
    updatedAt: Date
  ): Puesto {
    const puestoProps: PuestoProps = {
      nombre: props.nombre,
      descripcion: props.descripcion || undefined,
      isActive: props.isActive,
    };

    return new Puesto(puestoProps, id, createdAt, updatedAt);
  }

  // ============================================
  // GETTERS
  // ============================================

  get nombre(): string {
    return this.props.nombre;
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
   * Activa el puesto
   */
  activate(): void {
    if (this.props.isActive) {
      return; // Ya está activo
    }
    this.props.isActive = true;
    this.markAsUpdated();
  }

  /**
   * Desactiva el puesto (baja lógica)
   */
  deactivate(): void {
    if (!this.props.isActive) {
      return; // Ya está inactivo
    }
    this.props.isActive = false;
    this.markAsUpdated();
  }

  /**
   * Actualiza el nombre del puesto
   */
  updateNombre(nombre: string): void {
    const trimmedNombre = nombre.trim();
    if (!trimmedNombre) {
      throw new Error('El nombre del puesto es requerido');
    }
    this.props.nombre = trimmedNombre;
    this.markAsUpdated();
  }

  /**
   * Actualiza la descripción del puesto
   */
  updateDescripcion(descripcion: string | undefined): void {
    this.props.descripcion = descripcion?.trim() || undefined;
    this.markAsUpdated();
  }

  // ============================================
  // SERIALIZACIÓN
  // ============================================

  /**
   * Obtiene las propiedades del puesto (para persistencia)
   */
  toPersistence(): {
    id: string;
    nombre: string;
    descripcion?: string | undefined;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      nombre: this.props.nombre,
      descripcion: this.props.descripcion,
      isActive: this.props.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Obtiene la representación pública del puesto (para API)
   */
  toPublicJSON(): {
    id: string;
    nombre: string;
    descripcion?: string | undefined;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      nombre: this.props.nombre,
      descripcion: this.props.descripcion,
      isActive: this.props.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
