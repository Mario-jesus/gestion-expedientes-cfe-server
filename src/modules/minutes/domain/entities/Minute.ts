import { Entity } from '@shared/domain/entities/Entity';
import { MinuteType } from '../enums/MinuteType';

/**
 * Propiedades requeridas para crear una minuta
 */
export interface MinuteProps {
  titulo: string;
  tipo: MinuteType;
  descripcion?: string | undefined;
  fecha: Date; // Fecha del evento (no fecha de carga)
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  isActive: boolean;
}

/**
 * Entidad de dominio Minute
 * Representa un documento administrativo independiente de colaboradores
 * (minutas de reuniones, juntas, acuerdos, etc.)
 */
export class Minute extends Entity<MinuteProps> {
  private constructor(
    props: MinuteProps,
    id: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.props = props;
  }

  private props: MinuteProps;

  /**
   * Factory method para crear una nueva instancia de Minute
   */
  public static create(
    props: {
      titulo: string;
      tipo: MinuteType;
      descripcion?: string | undefined;
      fecha: Date;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
      uploadedBy: string;
      uploadedAt?: Date;
      isActive?: boolean;
    },
    id?: string
  ): Minute {
    const minuteId = id || crypto.randomUUID();

    // Validaciones
    if (!props.titulo || props.titulo.trim().length === 0) {
      throw new Error('El título es requerido');
    }

    if (!props.tipo) {
      throw new Error('El tipo es requerido');
    }

    if (!Object.values(MinuteType).includes(props.tipo)) {
      throw new Error(
        `El tipo debe ser uno de: ${Object.values(MinuteType).join(', ')}`
      );
    }

    if (!props.fecha) {
      throw new Error('La fecha es requerida');
    }

    if (!(props.fecha instanceof Date) || isNaN(props.fecha.getTime())) {
      throw new Error('La fecha debe ser una fecha válida');
    }

    if (!props.fileName || props.fileName.trim().length === 0) {
      throw new Error('El fileName es requerido');
    }

    if (!props.fileUrl || props.fileUrl.trim().length === 0) {
      throw new Error('El fileUrl es requerido');
    }

    if (props.fileSize < 0) {
      throw new Error('El fileSize debe ser un número positivo');
    }

    if (!props.fileType || props.fileType.trim().length === 0) {
      throw new Error('El fileType es requerido');
    }

    if (!props.uploadedBy || props.uploadedBy.trim().length === 0) {
      throw new Error('El uploadedBy es requerido');
    }

    const minuteProps: MinuteProps = {
      titulo: props.titulo.trim(),
      tipo: props.tipo,
      descripcion: props.descripcion?.trim() || undefined,
      fecha: props.fecha,
      fileName: props.fileName.trim(),
      fileUrl: props.fileUrl.trim(),
      fileSize: props.fileSize,
      fileType: props.fileType.trim(),
      uploadedBy: props.uploadedBy.trim(),
      uploadedAt: props.uploadedAt || new Date(),
      isActive: props.isActive !== undefined ? props.isActive : true,
    };

    const minute = new Minute(minuteProps, minuteId);
    return minute;
  }

  /**
   * Factory method para reconstruir una Minute desde persistencia
   */
  public static fromPersistence(
    props: {
      titulo: string;
      tipo: MinuteType;
      descripcion?: string | undefined;
      fecha: Date;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
      uploadedBy: string;
      uploadedAt: Date;
      isActive: boolean;
    },
    id: string,
    createdAt: Date,
    updatedAt: Date
  ): Minute {
    const minuteProps: MinuteProps = {
      titulo: props.titulo,
      tipo: props.tipo,
      descripcion: props.descripcion || undefined,
      fecha: props.fecha,
      fileName: props.fileName,
      fileUrl: props.fileUrl,
      fileSize: props.fileSize,
      fileType: props.fileType,
      uploadedBy: props.uploadedBy,
      uploadedAt: props.uploadedAt,
      isActive: props.isActive,
    };

    return new Minute(minuteProps, id, createdAt, updatedAt);
  }

  // ============================================
  // GETTERS
  // ============================================

  get titulo(): string {
    return this.props.titulo;
  }

  get tipo(): MinuteType {
    return this.props.tipo;
  }

  get descripcion(): string | undefined {
    return this.props.descripcion;
  }

  get fecha(): Date {
    return this.props.fecha;
  }

  get fileName(): string {
    return this.props.fileName;
  }

  get fileUrl(): string {
    return this.props.fileUrl;
  }

  get fileSize(): number {
    return this.props.fileSize;
  }

  get fileType(): string {
    return this.props.fileType;
  }

  get uploadedBy(): string {
    return this.props.uploadedBy;
  }

  get uploadedAt(): Date {
    return this.props.uploadedAt;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  // ============================================
  // MÉTODOS DE NEGOCIO
  // ============================================

  /**
   * Activa la minuta
   */
  activate(): void {
    if (this.props.isActive) {
      return; // Ya está activa
    }
    this.props.isActive = true;
    this.markAsUpdated();
  }

  /**
   * Desactiva la minuta (baja lógica)
   */
  deactivate(): void {
    if (!this.props.isActive) {
      return; // Ya está inactiva
    }
    this.props.isActive = false;
    this.markAsUpdated();
  }

  /**
   * Actualiza el título de la minuta
   */
  updateTitulo(titulo: string): void {
    if (!titulo || titulo.trim().length === 0) {
      throw new Error('El título es requerido');
    }
    this.props.titulo = titulo.trim();
    this.markAsUpdated();
  }

  /**
   * Actualiza el tipo de la minuta
   */
  updateTipo(tipo: MinuteType): void {
    if (!tipo) {
      throw new Error('El tipo es requerido');
    }
    if (!Object.values(MinuteType).includes(tipo)) {
      throw new Error(
        `El tipo debe ser uno de: ${Object.values(MinuteType).join(', ')}`
      );
    }
    this.props.tipo = tipo;
    this.markAsUpdated();
  }

  /**
   * Actualiza la descripción de la minuta
   */
  updateDescripcion(descripcion: string | undefined): void {
    this.props.descripcion = descripcion?.trim() || undefined;
    this.markAsUpdated();
  }

  /**
   * Actualiza la fecha de la minuta (fecha del evento)
   */
  updateFecha(fecha: Date): void {
    if (!fecha) {
      throw new Error('La fecha es requerida');
    }
    if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
      throw new Error('La fecha debe ser una fecha válida');
    }
    this.props.fecha = fecha;
    this.markAsUpdated();
  }

  // ============================================
  // SERIALIZACIÓN
  // ============================================

  /**
   * Obtiene las propiedades de la minuta (para persistencia)
   */
  toPersistence(): {
    id: string;
    titulo: string;
    tipo: MinuteType;
    descripcion?: string;
    fecha: Date;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    uploadedBy: string;
    uploadedAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    const result: {
      id: string;
      titulo: string;
      tipo: MinuteType;
      descripcion?: string;
      fecha: Date;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
      uploadedBy: string;
      uploadedAt: Date;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    } = {
      id: this.id,
      titulo: this.props.titulo,
      tipo: this.props.tipo,
      fecha: this.props.fecha,
      fileName: this.props.fileName,
      fileUrl: this.props.fileUrl,
      fileSize: this.props.fileSize,
      fileType: this.props.fileType,
      uploadedBy: this.props.uploadedBy,
      uploadedAt: this.props.uploadedAt,
      isActive: this.props.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    if (this.props.descripcion !== undefined) {
      result.descripcion = this.props.descripcion;
    }

    return result;
  }

  /**
   * Obtiene los datos públicos de la minuta
   */
  toPublicJSON(): {
    id: string;
    titulo: string;
    tipo: MinuteType;
    descripcion?: string;
    fecha: Date;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    uploadedBy: string;
    uploadedAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return this.toPersistence();
  }
}
