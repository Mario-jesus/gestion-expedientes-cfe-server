import { Schema, model, Model, Document, Types } from 'mongoose';
import { TipoContrato } from '@modules/collaborators/domain/enums/TipoContrato';

/**
 * Documento de MongoDB para la entidad Collaborator
 * Representa cómo se almacena un colaborador en la base de datos
 */
export interface CollaboratorDocument extends Document {
  _id: Types.ObjectId;
  nombre: string;
  apellidos: string;
  rpe: string;
  rtt?: string;
  areaId: string;
  adscripcionId: string;
  puestoId: string;
  tipoContrato: TipoContrato;
  rfc: string;
  curp: string;
  imss: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Mongoose para Collaborator
 * Define la estructura y validaciones del documento en MongoDB
 */
const CollaboratorSchema = new Schema<CollaboratorDocument>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    apellidos: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    rpe: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
      index: true,
    },
    rtt: {
      type: String,
      required: false,
      trim: true,
      default: undefined,
    },
    areaId: {
      type: String,
      required: true,
      index: true,
    },
    adscripcionId: {
      type: String,
      required: true,
      index: true,
    },
    puestoId: {
      type: String,
      required: true,
      index: true,
    },
    tipoContrato: {
      type: String,
      required: true,
      enum: Object.values(TipoContrato),
    },
    rfc: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 12,
      maxlength: 13,
    },
    curp: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      length: 18,
    },
    imss: {
      type: String,
      required: true,
      trim: true,
      length: 11,
      validate: {
        validator: function(v: string) {
          return /^\d{11}$/.test(v);
        },
        message: 'El número de IMSS debe contener exactamente 11 dígitos',
      },
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
    collection: 'collaborators', // Nombre de la colección en MongoDB
  }
);

// Índices compuestos para búsquedas comunes
CollaboratorSchema.index({ areaId: 1, isActive: 1 });
CollaboratorSchema.index({ adscripcionId: 1, isActive: 1 });
CollaboratorSchema.index({ puestoId: 1, isActive: 1 });
CollaboratorSchema.index({ tipoContrato: 1, isActive: 1 });
CollaboratorSchema.index({ isActive: 1, createdAt: -1 });

// Índice de texto para búsqueda full-text (busca en nombre, apellidos, RPE)
CollaboratorSchema.index(
  { nombre: 'text', apellidos: 'text', rpe: 'text' },
  { name: 'collaborator_text_search' }
);

// Índice compuesto para área + adscripción (para validar relaciones)
CollaboratorSchema.index({ areaId: 1, adscripcionId: 1 });

/**
 * Modelo de Mongoose para Collaborator
 * Se registra automáticamente cuando se importa este archivo
 */
export const CollaboratorModel: Model<CollaboratorDocument> = model<CollaboratorDocument>(
  'Collaborator',
  CollaboratorSchema
);
