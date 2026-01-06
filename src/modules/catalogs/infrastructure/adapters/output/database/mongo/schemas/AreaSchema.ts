import { Schema, model, Model, Document, Types } from 'mongoose';

/**
 * Documento de MongoDB para la entidad Area
 * Representa cómo se almacena un área en la base de datos
 */
export interface AreaDocument extends Document {
  _id: Types.ObjectId;
  nombre: string;
  descripcion?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Mongoose para Area
 * Define la estructura y validaciones del documento en MongoDB
 */
const AreaSchema = new Schema<AreaDocument>(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
      index: true,
    },
    descripcion: {
      type: String,
      required: false,
      trim: true,
      maxlength: 1000,
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
    collection: 'areas', // Nombre de la colección en MongoDB
  }
);

// Índices compuestos para búsquedas comunes
AreaSchema.index({ isActive: 1, createdAt: -1 });

// Índice de texto para búsqueda full-text (busca en nombre)
AreaSchema.index(
  { nombre: 'text' },
  { name: 'area_text_search' }
);

/**
 * Modelo de Mongoose para Area
 * Se registra automáticamente cuando se importa este archivo
 */
export const AreaModel: Model<AreaDocument> = model<AreaDocument>(
  'Area',
  AreaSchema
);
