import { Schema, model, Model, Document, Types } from 'mongoose';
import { LogAction } from '../../../../../../domain/enums/LogAction';
import { LogEntity } from '../../../../../../domain/enums/LogEntity';

/**
 * Documento de MongoDB para la entidad LogEntry
 * Representa cómo se almacena un log de auditoría en la base de datos
 */
export interface LogEntryMongo extends Document {
  _id: Types.ObjectId;
  userId: string;
  action: LogAction;
  entity: LogEntity;
  entityId: string;
  metadata?: Record<string, unknown> | undefined;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Mongoose para LogEntry
 * Define la estructura y validaciones del log de auditoría en MongoDB
 * 
 * Nota: Los logs son inmutables, por lo que no tienen campos de actualización
 * excepto los timestamps automáticos de Mongoose
 */
const LogEntrySchema = new Schema<LogEntryMongo>(
  {
    userId: {
      type: String,
      required: true,
      index: true, // Índice para búsquedas por usuario
    },
    action: {
      type: String,
      required: true,
      enum: Object.values(LogAction),
      index: true, // Índice para filtros por tipo de acción
    },
    entity: {
      type: String,
      required: true,
      enum: Object.values(LogEntity),
      index: true, // Índice para filtros por tipo de entidad
    },
    entityId: {
      type: String,
      required: true,
      index: true, // Índice para búsquedas por entidad específica
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
      // No se valida estructura porque puede variar según el tipo de evento
    },
  },
  {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
    collection: 'log_entries', // Nombre de la colección en MongoDB
  }
);

// Índices compuestos para búsquedas comunes

// Búsqueda por usuario y acción (ej: todas las creaciones de un usuario)
LogEntrySchema.index({ userId: 1, action: 1 });

// Búsqueda por entidad y entityId (ej: historial completo de un documento)
LogEntrySchema.index({ entity: 1, entityId: 1 });

// Búsqueda por usuario y entidad (ej: todas las acciones de un usuario sobre documentos)
LogEntrySchema.index({ userId: 1, entity: 1 });

// Búsqueda por acción y entidad (ej: todas las eliminaciones de documentos)
LogEntrySchema.index({ action: 1, entity: 1 });

// Búsqueda por usuario, entidad y entityId (ej: acciones de un usuario sobre una entidad específica)
LogEntrySchema.index({ userId: 1, entity: 1, entityId: 1 });

// Búsqueda por usuario y fecha (para ordenamiento cronológico)
LogEntrySchema.index({ userId: 1, createdAt: -1 });

// Búsqueda por entidad, entityId y fecha (historial ordenado de una entidad)
LogEntrySchema.index({ entity: 1, entityId: 1, createdAt: -1 });

// Índice para ordenamiento por fecha (más reciente primero)
LogEntrySchema.index({ createdAt: -1 });

// Índice compuesto para filtros por rango de fechas
LogEntrySchema.index({ createdAt: 1 });

// Índice compuesto para búsquedas complejas: usuario, acción, entidad y fecha
LogEntrySchema.index({ userId: 1, action: 1, entity: 1, createdAt: -1 });

/**
 * Modelo de Mongoose para LogEntry
 * Se registra automáticamente cuando se importa este archivo
 */
export const LogEntryModel: Model<LogEntryMongo> = model<LogEntryMongo>(
  'LogEntry',
  LogEntrySchema
);
