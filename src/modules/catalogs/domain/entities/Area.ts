import { Entity } from '@shared/domain/entities/Entity';

/**
 * Propiedades requeridas para crear un área
 */
export interface AreaProps {
  nombre: string;
  descripcion?: string | undefined;
  isActive: boolean;
}

/**
 * Entidad de dominio Area
 * Representa un área organizacional de CFE (Generación, Transmisión, Distribución, etc.)
 */
export class Area extends Entity<AreaProps> {
  private constructor(
    props: AreaProps,
    id: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.props = props;
  }

  private props: AreaProps;

  /**
   * Factory method para crear una nueva instancia de Area
   */
  public static create(
    props: {
      nombre: string;
      descripcion?: string | undefined;
      isActive: boolean;
    },
    id?: string
  ): Area {
    const areaId = id || crypto.randomUUID();

    const trimmedNombre = props.nombre.trim();
    if (!trimmedNombre) {
      throw new Error('El nombre del área es requerido');
    }

    const areaProps: AreaProps = {
      nombre: trimmedNombre,
      descripcion: props.descripcion?.trim() || undefined,
      isActive: props.isActive,
    };

    const area = new Area(areaProps, areaId);
    return area;
  }

  /**
   * Factory method para reconstruir un Area desde persistencia
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
  ): Area {
    const areaProps: AreaProps = {
      nombre: props.nombre,
      descripcion: props.descripcion || undefined,
      isActive: props.isActive,
    };

    return new Area(areaProps, id, createdAt, updatedAt);
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
   * Activa el área
   */
  activate(): void {
    if (this.props.isActive) {
      return; // Ya está activo
    }
    this.props.isActive = true;
    this.markAsUpdated();
  }

  /**
   * Desactiva el área (baja lógica)
   */
  deactivate(): void {
    if (!this.props.isActive) {
      return; // Ya está inactivo
    }
    this.props.isActive = false;
    this.markAsUpdated();
  }

  /**
   * Actualiza el nombre del área
   */
  updateNombre(nombre: string): void {
    const trimmedNombre = nombre.trim();
    if (!trimmedNombre) {
      throw new Error('El nombre del área es requerido');
    }
    this.props.nombre = trimmedNombre;
    this.markAsUpdated();
  }

  /**
   * Actualiza la descripción del área
   */
  updateDescripcion(descripcion: string | undefined): void {
    this.props.descripcion = descripcion?.trim() || undefined;
    this.markAsUpdated();
  }

  // ============================================
  // SERIALIZACIÓN
  // ============================================

  /**
   * Obtiene las propiedades del área (para persistencia)
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
   * Obtiene la representación pública del área (para API)
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
