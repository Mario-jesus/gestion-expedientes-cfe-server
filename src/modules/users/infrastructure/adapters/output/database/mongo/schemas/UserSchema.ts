import { Schema, model, Model, Document, Types } from 'mongoose';
import { UserRole } from '@modules/users/domain/enums/UserRole';

/**
 * Documento de MongoDB para la entidad User
 * Representa cómo se almacena un usuario en la base de datos
 */
export interface UserDocument extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string; // Contraseña hasheada
  name: string;
  role: UserRole;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Mongoose para User
 * Define la estructura y validaciones del documento en MongoDB
 */
const UserSchema = new Schema<UserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 50,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email válido'],
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 60, // Bcrypt hashes are 60 characters
      maxlength: 255,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    role: {
      type: String,
      required: true,
      enum: Object.values(UserRole),
      default: UserRole.OPERATOR,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    createdBy: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
    collection: 'users', // Nombre de la colección en MongoDB
  }
);

// Índices compuestos para búsquedas comunes
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ isActive: 1, createdAt: -1 });

// Índice de texto para búsqueda full-text (opcional, para búsquedas por nombre, username, email)
UserSchema.index(
  { username: 'text', email: 'text', name: 'text' },
  { name: 'user_text_search' }
);

/**
 * Modelo de Mongoose para User
 * Se registra automáticamente cuando se importa este archivo
 */
export const UserModel: Model<UserDocument> = model<UserDocument>('User', UserSchema);
