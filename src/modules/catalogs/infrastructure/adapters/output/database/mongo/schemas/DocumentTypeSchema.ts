import { Schema, model, Model, Document, Types } from 'mongoose';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';

/**
 * Documento de MongoDB para la entidad DocumentType
 * Representa cómo se almacena un tipo de documento en la base de datos
 */
export interface DocumentTypeDocument extends Document {
  _id: Types.ObjectId;
  nombre: string;
  kind: DocumentKind;
  descripcion?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Mongoose para DocumentType
 * Define la estructura y validaciones del documento en MongoDB
 */
const DocumentTypeSchema = new Schema<DocumentTypeDocument>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
      index: true,
    },
    kind: {
      type: String,
      required: true,
      enum: Object.values(DocumentKind),
      index: true,
    },
    descripcion: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
    collection: 'documentTypes', // Nombre de la colección en MongoDB
  }
);

// Índice único compuesto: nombre debe ser único dentro del kind
DocumentTypeSchema.index(
  { nombre: 1, kind: 1 },
  { unique: true, name: 'nombre_kind_unique' }
);

// Índices compuestos para búsquedas comunes
DocumentTypeSchema.index({ kind: 1, isActive: 1 });
DocumentTypeSchema.index({ isActive: 1, createdAt: -1 });

// Índice de texto para búsqueda full-text (busca en nombre)
DocumentTypeSchema.index(
  { nombre: 'text' },
  { name: 'documentType_text_search' }
);

/**
 * Modelo de Mongoose para DocumentType
 * Se registra automáticamente cuando se importa este archivo
 */
export const DocumentTypeModel: Model<DocumentTypeDocument> = model<DocumentTypeDocument>(
  'DocumentType',
  DocumentTypeSchema
);
