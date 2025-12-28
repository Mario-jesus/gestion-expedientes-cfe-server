import { Entity } from '@shared/domain/entities/Entity';
import { DocumentKind } from '../enums/DocumentKind';

/**
 * Propiedades requeridas para crear un tipo de documento
 */
export interface DocumentTypeProps {
  nombre: string;
  kind: DocumentKind;
  descripcion?: string | undefined;
  isActive: boolean;
}

/**
 * Entidad de dominio DocumentType
 * Representa un tipo específico para clasificar documentos del tipo "otro"
 * (ej: Identificación Oficial, Comprobante de Domicilio)
 */
export class DocumentType extends Entity<DocumentTypeProps> {
  private constructor(
    props: DocumentTypeProps,
    id: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.props = props;
  }

  private props: DocumentTypeProps;

  /**
   * Factory method para crear una nueva instancia de DocumentType
   */
  public static create(
    props: {
      nombre: string;
      kind: DocumentKind;
      descripcion?: string | undefined;
      isActive: boolean;
    },
    id?: string
  ): DocumentType {
    const documentTypeId = id || crypto.randomUUID();

    const trimmedNombre = props.nombre.trim();
    if (!trimmedNombre) {
      throw new Error('El nombre del tipo de documento es requerido');
    }

    if (!Object.values(DocumentKind).includes(props.kind)) {
      throw new Error(
        `El kind debe ser uno de: ${Object.values(DocumentKind).join(', ')}`
      );
    }

    const documentTypeProps: DocumentTypeProps = {
      nombre: trimmedNombre,
      kind: props.kind,
      descripcion: props.descripcion?.trim() || undefined,
      isActive: props.isActive,
    };

    const documentType = new DocumentType(documentTypeProps, documentTypeId);
    return documentType;
  }

  /**
   * Factory method para reconstruir un DocumentType desde persistencia
   */
  public static fromPersistence(
    props: {
      nombre: string;
      kind: DocumentKind;
      descripcion?: string | undefined;
      isActive: boolean;
    },
    id: string,
    createdAt: Date,
    updatedAt: Date
  ): DocumentType {
    const documentTypeProps: DocumentTypeProps = {
      nombre: props.nombre,
      kind: props.kind,
      descripcion: props.descripcion || undefined,
      isActive: props.isActive,
    };

    return new DocumentType(documentTypeProps, id, createdAt, updatedAt);
  }

  // ============================================
  // GETTERS
  // ============================================

  get nombre(): string {
    return this.props.nombre;
  }

  get kind(): DocumentKind {
    return this.props.kind;
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
   * Activa el tipo de documento
   */
  activate(): void {
    if (this.props.isActive) {
      return; // Ya está activo
    }
    this.props.isActive = true;
    this.markAsUpdated();
  }

  /**
   * Desactiva el tipo de documento (baja lógica)
   */
  deactivate(): void {
    if (!this.props.isActive) {
      return; // Ya está inactivo
    }
    this.props.isActive = false;
    this.markAsUpdated();
  }

  /**
   * Actualiza el nombre del tipo de documento
   */
  updateNombre(nombre: string): void {
    const trimmedNombre = nombre.trim();
    if (!trimmedNombre) {
      throw new Error('El nombre del tipo de documento es requerido');
    }
    this.props.nombre = trimmedNombre;
    this.markAsUpdated();
  }

  /**
   * Actualiza la descripción del tipo de documento
   */
  updateDescripcion(descripcion: string | undefined): void {
    this.props.descripcion = descripcion?.trim() || undefined;
    this.markAsUpdated();
  }

  /**
   * Actualiza el kind del tipo de documento
   */
  updateKind(kind: DocumentKind): void {
    if (!Object.values(DocumentKind).includes(kind)) {
      throw new Error(
        `El kind debe ser uno de: ${Object.values(DocumentKind).join(', ')}`
      );
    }
    this.props.kind = kind;
    this.markAsUpdated();
  }

  // ============================================
  // SERIALIZACIÓN
  // ============================================

  /**
   * Obtiene las propiedades del tipo de documento (para persistencia)
   */
  toPersistence(): {
    id: string;
    nombre: string;
    kind: DocumentKind;
    descripcion?: string | undefined;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      nombre: this.props.nombre,
      kind: this.props.kind,
      descripcion: this.props.descripcion,
      isActive: this.props.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Obtiene la representación pública del tipo de documento (para API)
   */
  toPublicJSON(): {
    id: string;
    nombre: string;
    kind: DocumentKind;
    descripcion?: string | undefined;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      nombre: this.props.nombre,
      kind: this.props.kind,
      descripcion: this.props.descripcion,
      isActive: this.props.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
