/**
 * Barrel export para todos los esquemas/modelos de Mongoose del módulo auth
 * 
 * Este archivo importa todos los esquemas para que Mongoose los registre
 * automáticamente cuando se importa este módulo.
 * 
 * IMPORTANTE: Los modelos se registran automáticamente cuando se importan
 * los archivos que los definen (al ejecutar model() o mongoose.model()).
 */

// ============================================
// ESQUEMAS/MODELOS DEL MÓDULO AUTH
// ============================================
// Importa aquí todos los esquemas de este módulo
import './RefreshTokenSchema';

// Los modelos se registran automáticamente al importar los archivos
// No necesitas exportar nada, solo importar

export { RefreshTokenModel, type RefreshTokenDocument } from './RefreshTokenSchema';
