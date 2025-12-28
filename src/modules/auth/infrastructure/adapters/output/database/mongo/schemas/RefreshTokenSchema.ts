import { Schema, model, Model, Document, Types } from 'mongoose';

/**
 * Documento de MongoDB para la entidad RefreshToken
 * Representa cómo se almacena un refresh token en la base de datos
 */
export interface RefreshTokenDocument extends Document {
  _id: Types.ObjectId;
  token: string; // Token JWT completo
  userId: string; // ID del usuario propietario del token
  expiresAt: Date; // Fecha de expiración del token
  isRevoked: boolean; // Si el token ha sido revocado (logout)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Mongoose para RefreshToken
 * Define la estructura y validaciones del documento en MongoDB
 */
const RefreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true, // Índice para búsquedas rápidas por token
    },
    userId: {
      type: String,
      required: true,
      index: true, // Índice para búsquedas por usuario
    },
    expiresAt: {
      type: Date,
      required: true,
      index: {
        expireAfterSeconds: 0, // TTL automático: eliminar documentos expirados
      },
    },
    isRevoked: {
      type: Boolean,
      required: true,
      default: false,
      index: true, // Índice para filtrar tokens activos
    },
  },
  {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
    collection: 'refresh_tokens', // Nombre de la colección en MongoDB
  }
);

// Índices compuestos para búsquedas comunes
// Búsqueda de tokens activos de un usuario (no revocados y no expirados)
RefreshTokenSchema.index({ userId: 1, isRevoked: 1, expiresAt: 1 });

// Índice para limpieza de tokens expirados y revocados
RefreshTokenSchema.index({ expiresAt: 1, isRevoked: 1 });

// Índice para búsqueda de tokens por usuario y estado
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });

/**
 * Modelo de Mongoose para RefreshToken
 * Se registra automáticamente cuando se importa este archivo
 */
export const RefreshTokenModel: Model<RefreshTokenDocument> = model<RefreshTokenDocument>(
  'RefreshToken',
  RefreshTokenSchema
);
