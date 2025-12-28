import { Schema, model, Model, Document, Types } from 'mongoose';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';

/**
 * Documento de MongoDB para la entidad CollaboratorDocument
 * Representa cómo se almacena un documento en la base de datos
 * 
 * Nota: El nombre "CollaboratorDocument" puede ser confuso porque también
 * es el nombre de la interfaz de Mongoose Document. En el contexto del módulo
 * de documentos, este es el schema para documentos de colaboradores.
 */
export interface CollaboratorDocumentMongo extends Document {
  _id: Types.ObjectId;
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
}

/**
 * Schema de Mongoose para CollaboratorDocument
 * Define la estructura y validaciones del documento en MongoDB
 */
const CollaboratorDocumentSchema = new Schema<CollaboratorDocumentMongo>(
  {
    collaboratorId: {
      type: String,
      required: true,
      index: true, // Índice para búsquedas por colaborador
    },
    kind: {
      type: String,
      required: true,
      enum: Object.values(DocumentKind),
      index: true, // Índice para filtros por tipo
    },
    periodo: {
      type: String,
      required: false,
      trim: true,
      maxlength: 50, // Ej: "2024-Q1", "2024"
    },
    descripcion: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0, // Tamaño debe ser positivo
    },
    fileType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100, // Tipo MIME
    },
    uploadedBy: {
      type: String,
      required: true,
      index: true, // Índice para auditoría
    },
    uploadedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true, // Índice para ordenamiento por fecha
    },
    documentTypeId: {
      type: String,
      required: false,
      index: true, // Índice para filtros cuando kind='otro'
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true, // Índice para filtros de estado
    },
  },
  {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
    collection: 'collaboratorDocuments', // Nombre de la colección en MongoDB
  }
);

// Índices compuestos para búsquedas comunes
// Búsqueda por colaborador y tipo
CollaboratorDocumentSchema.index({ collaboratorId: 1, kind: 1, isActive: 1 });

// Búsqueda por colaborador y estado
CollaboratorDocumentSchema.index({ collaboratorId: 1, isActive: 1 });

// Búsqueda por tipo y estado
CollaboratorDocumentSchema.index({ kind: 1, isActive: 1 });

// Búsqueda por colaborador, tipo y período (útil para historiales)
CollaboratorDocumentSchema.index({ collaboratorId: 1, kind: 1, periodo: 1 });

// Índice para ordenamiento por fecha de subida
CollaboratorDocumentSchema.index({ uploadedAt: -1 });

// Índice compuesto para validar duplicados (colaborador + kind + activo)
// Útil para validar que no haya duplicados de batería o perfil
CollaboratorDocumentSchema.index(
  { collaboratorId: 1, kind: 1, isActive: 1 },
  {
    unique: false, // No único porque puede haber múltiples documentos del mismo tipo
    partialFilterExpression: { isActive: true }, // Solo aplicar a documentos activos
  }
);

// Índice de texto para búsqueda full-text en descripción y fileName
CollaboratorDocumentSchema.index(
  { descripcion: 'text', fileName: 'text' },
  { name: 'document_text_search' }
);

/**
 * Modelo de Mongoose para CollaboratorDocument
 * Se registra automáticamente cuando se importa este archivo
 */
export const CollaboratorDocumentModel: Model<CollaboratorDocumentMongo> = model<CollaboratorDocumentMongo>(
  'CollaboratorDocument',
  CollaboratorDocumentSchema
);

