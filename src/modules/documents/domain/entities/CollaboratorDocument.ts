import { Entity } from '@shared/domain/entities/Entity';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';

/**
 * Propiedades requeridas para crear un documento de colaborador
 */
export interface CollaboratorDocumentProps {
  collaboratorId: string;
  kind: DocumentKind;
  periodo?: string | undefined;
  descripcion?: string | undefined;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  documentTypeId?: string | undefined; // Solo para kind: 'otro'
  isActive: boolean;
}

/**
 * Entidad de dominio CollaboratorDocument
 * Representa un documento del expediente de un colaborador
 */
export class CollaboratorDocument extends Entity<CollaboratorDocumentProps> {
  private constructor(
    props: CollaboratorDocumentProps,
    id: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.props = props;
  }

  private props: CollaboratorDocumentProps;

  /**
   * Factory method para crear una nueva instancia de CollaboratorDocument
   */
  public static create(
    props: {
      collaboratorId: string;
      kind: DocumentKind;
      periodo?: string | undefined;
      descripcion?: string | undefined;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
      uploadedBy: string;
      uploadedAt?: Date;
      documentTypeId?: string | undefined;
      isActive?: boolean;
    },
    id?: string
  ): CollaboratorDocument {
    const documentId = id || crypto.randomUUID();

    // Validaciones
    if (!props.collaboratorId || props.collaboratorId.trim().length === 0) {
      throw new Error('El collaboratorId es requerido');
    }

    if (!props.kind) {
      throw new Error('El kind es requerido');
    }

    if (!Object.values(DocumentKind).includes(props.kind)) {
      throw new Error(
        `El kind debe ser uno de: ${Object.values(DocumentKind).join(', ')}`
      );
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

    // Validar que si kind es 'otro', se recomienda documentTypeId
    if (props.kind === DocumentKind.OTRO && !props.documentTypeId) {
      // No es un error, solo una advertencia (se puede crear sin documentTypeId)
      // Pero es recomendado tenerlo
    }

    const documentProps: CollaboratorDocumentProps = {
      collaboratorId: props.collaboratorId.trim(),
      kind: props.kind,
      periodo: props.periodo?.trim() || undefined,
      descripcion: props.descripcion?.trim() || undefined,
      fileName: props.fileName.trim(),
      fileUrl: props.fileUrl.trim(),
      fileSize: props.fileSize,
      fileType: props.fileType.trim(),
      uploadedBy: props.uploadedBy.trim(),
      uploadedAt: props.uploadedAt || new Date(),
      documentTypeId: props.documentTypeId?.trim() || undefined,
      isActive: props.isActive !== undefined ? props.isActive : true,
    };

    const document = new CollaboratorDocument(documentProps, documentId);
    return document;
  }

  /**
   * Factory method para reconstruir un CollaboratorDocument desde persistencia
   */
  public static fromPersistence(
    props: {
      collaboratorId: string;
      kind: DocumentKind;
      periodo?: string | undefined;
      descripcion?: string | undefined;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
      uploadedBy: string;
      uploadedAt: Date;
      documentTypeId?: string | undefined;
      isActive: boolean;
    },
    id: string,
    createdAt: Date,
    updatedAt: Date
  ): CollaboratorDocument {
    const documentProps: CollaboratorDocumentProps = {
      collaboratorId: props.collaboratorId,
      kind: props.kind,
      periodo: props.periodo || undefined,
      descripcion: props.descripcion || undefined,
      fileName: props.fileName,
      fileUrl: props.fileUrl,
      fileSize: props.fileSize,
      fileType: props.fileType,
      uploadedBy: props.uploadedBy,
      uploadedAt: props.uploadedAt,
      documentTypeId: props.documentTypeId || undefined,
      isActive: props.isActive,
    };

    return new CollaboratorDocument(documentProps, id, createdAt, updatedAt);
  }

  // ============================================
  // GETTERS
  // ============================================

  get collaboratorId(): string {
    return this.props.collaboratorId;
  }

  get kind(): DocumentKind {
    return this.props.kind;
  }

  get periodo(): string | undefined {
    return this.props.periodo;
  }

  get descripcion(): string | undefined {
    return this.props.descripcion;
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

  get documentTypeId(): string | undefined {
    return this.props.documentTypeId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  // ============================================
  // MÉTODOS DE NEGOCIO
  // ============================================

  /**
   * Activa el documento
   */
  activate(): void {
    if (this.props.isActive) {
      return; // Ya está activo
    }
    this.props.isActive = true;
    this.markAsUpdated();
  }

  /**
   * Desactiva el documento (baja lógica)
   */
  deactivate(): void {
    if (!this.props.isActive) {
      return; // Ya está inactivo
    }
    this.props.isActive = false;
    this.markAsUpdated();
  }

  /**
   * Actualiza el período del documento
   */
  updatePeriodo(periodo: string | undefined): void {
    this.props.periodo = periodo?.trim() || undefined;
    this.markAsUpdated();
  }

  /**
   * Actualiza la descripción del documento
   */
  updateDescripcion(descripcion: string | undefined): void {
    this.props.descripcion = descripcion?.trim() || undefined;
    this.markAsUpdated();
  }

  /**
   * Actualiza el documentTypeId (solo para kind: 'otro')
   */
  updateDocumentTypeId(documentTypeId: string | undefined): void {
    if (this.props.kind !== DocumentKind.OTRO && documentTypeId) {
      throw new Error(
        'documentTypeId solo puede ser especificado cuando kind es "otro"'
      );
    }
    this.props.documentTypeId = documentTypeId?.trim() || undefined;
    this.markAsUpdated();
  }

  /**
   * Nota: collaboratorId y kind NO se pueden cambiar después de crear
   * Si se necesita cambiar, se debe eliminar y crear un nuevo documento
   */

  // ============================================
  // SERIALIZACIÓN
  // ============================================

  /**
   * Obtiene las propiedades del documento (para persistencia)
   */
  toPersistence(): {
    id: string;
    collaboratorId: string;
    kind: DocumentKind;
    periodo?: string;
    descripcion?: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    uploadedBy: string;
    uploadedAt: Date;
    documentTypeId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    const result: {
      id: string;
      collaboratorId: string;
      kind: DocumentKind;
      periodo?: string;
      descripcion?: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
      uploadedBy: string;
      uploadedAt: Date;
      documentTypeId?: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    } = {
      id: this.id,
      collaboratorId: this.props.collaboratorId,
      kind: this.props.kind,
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

    if (this.props.periodo !== undefined) {
      result.periodo = this.props.periodo;
    }

    if (this.props.descripcion !== undefined) {
      result.descripcion = this.props.descripcion;
    }

    if (this.props.documentTypeId !== undefined) {
      result.documentTypeId = this.props.documentTypeId;
    }

    return result;
  }

  /**
   * Obtiene los datos públicos del documento
   */
  toPublicJSON(): {
    id: string;
    collaboratorId: string;
    kind: DocumentKind;
    periodo?: string;
    descripcion?: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    uploadedBy: string;
    uploadedAt: Date;
    documentTypeId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return this.toPersistence();
  }
}
