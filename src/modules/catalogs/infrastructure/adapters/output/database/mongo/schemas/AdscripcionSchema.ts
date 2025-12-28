import { Schema, model, Model, Document, Types } from 'mongoose';

/**
 * Documento de MongoDB para la entidad Adscripcion
 * Representa cómo se almacena una adscripción en la base de datos
 */
export interface AdscripcionDocument extends Document {
  _id: Types.ObjectId;
  nombre: string;
  areaId: string;
  descripcion?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Mongoose para Adscripcion
 * Define la estructura y validaciones del documento en MongoDB
 */
const AdscripcionSchema = new Schema<AdscripcionDocument>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
      index: true,
    },
    areaId: {
      type: String,
      required: true,
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
    collection: 'adscripciones', // Nombre de la colección en MongoDB
  }
);

// Índice único compuesto: nombre debe ser único dentro del área
AdscripcionSchema.index(
  { nombre: 1, areaId: 1 },
  { unique: true, name: 'nombre_areaId_unique' }
);

// Índices compuestos para búsquedas comunes
AdscripcionSchema.index({ areaId: 1, isActive: 1 });
AdscripcionSchema.index({ isActive: 1, createdAt: -1 });

// Índice de texto para búsqueda full-text (busca en nombre)
AdscripcionSchema.index(
  { nombre: 'text' },
  { name: 'adscripcion_text_search' }
);

/**
 * Modelo de Mongoose para Adscripcion
 * Se registra automáticamente cuando se importa este archivo
 */
export const AdscripcionModel: Model<AdscripcionDocument> = model<AdscripcionDocument>(
  'Adscripcion',
  AdscripcionSchema
);
