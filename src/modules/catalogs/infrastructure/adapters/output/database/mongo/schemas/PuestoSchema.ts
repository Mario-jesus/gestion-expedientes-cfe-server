import { Schema, model, Model, Document, Types } from 'mongoose';

/**
 * Documento de MongoDB para la entidad Puesto
 * Representa cómo se almacena un puesto en la base de datos
 */
export interface PuestoDocument extends Document {
  _id: Types.ObjectId;
  nombre: string;
  descripcion?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Mongoose para Puesto
 * Define la estructura y validaciones del documento en MongoDB
 */
const PuestoSchema = new Schema<PuestoDocument>(
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
    collection: 'puestos', // Nombre de la colección en MongoDB
  }
);

// Índices compuestos para búsquedas comunes
PuestoSchema.index({ isActive: 1, createdAt: -1 });

// Índice de texto para búsqueda full-text (busca en nombre)
PuestoSchema.index(
  { nombre: 'text' },
  { name: 'puesto_text_search' }
);

/**
 * Modelo de Mongoose para Puesto
 * Se registra automáticamente cuando se importa este archivo
 */
export const PuestoModel: Model<PuestoDocument> = model<PuestoDocument>(
  'Puesto',
  PuestoSchema
);
