import { Schema, model, Model, Document, Types } from 'mongoose';
import { MinuteType } from '../../../../../../domain/enums/MinuteType';

/**
 * Documento de MongoDB para la entidad Minute
 * Representa cómo se almacena una minuta en la base de datos
 */
export interface MinuteMongo extends Document {
  _id: Types.ObjectId;
  titulo: string;
  tipo: MinuteType;
  descripcion?: string;
  fecha: Date; // Fecha del evento (no fecha de carga)
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Mongoose para Minute
 * Define la estructura y validaciones de la minuta en MongoDB
 */
const MinuteSchema = new Schema<MinuteMongo>(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
      // Índice definido más abajo para evitar duplicados
    },
    tipo: {
      type: String,
      required: true,
      enum: Object.values(MinuteType),
      index: true, // Índice para filtros por tipo
    },
    descripcion: {
      type: String,
      required: false,
      trim: true,
      maxlength: 1000,
    },
    fecha: {
      type: Date,
      required: true,
      index: true, // Índice para filtros por fecha del evento
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
      index: true, // Índice para ordenamiento por fecha de carga
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
    collection: 'minutes', // Nombre de la colección en MongoDB
  }
);

// Índices compuestos para búsquedas comunes
// Búsqueda por tipo y estado
MinuteSchema.index({ tipo: 1, isActive: 1 });

// Búsqueda por fecha del evento y estado (para filtros por rango de fechas)
MinuteSchema.index({ fecha: 1, isActive: 1 });

// Búsqueda por tipo, fecha y estado (combinación común)
MinuteSchema.index({ tipo: 1, fecha: 1, isActive: 1 });

// Índice para ordenamiento por fecha del evento
MinuteSchema.index({ fecha: -1 });

// Índice para ordenamiento por fecha de carga
MinuteSchema.index({ uploadedAt: -1 });

// Índice para ordenamiento por título
MinuteSchema.index({ titulo: 1 });

// Índice de texto para búsqueda full-text en título y descripción
MinuteSchema.index(
  { titulo: 'text', descripcion: 'text' },
  { name: 'minute_text_search' }
);

/**
 * Modelo de Mongoose para Minute
 * Se registra automáticamente cuando se importa este archivo
 */
export const MinuteModel: Model<MinuteMongo> = model<MinuteMongo>(
  'Minute',
  MinuteSchema
);
