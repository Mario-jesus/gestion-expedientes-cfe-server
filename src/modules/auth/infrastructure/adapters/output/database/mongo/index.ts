/**
 * Barrel export para el módulo de base de datos MongoDB del módulo auth
 * 
 * Este archivo importa todos los schemas para que Mongoose los registre
 * automáticamente cuando se importa este módulo.
 * 
 * IMPORTANTE: Los modelos se registran automáticamente cuando se importan
 * los archivos que los definen (al ejecutar model() o mongoose.model()).
 */

// ============================================
// IMPORTAR ESQUEMAS (para registro automático)
// ============================================
// Importar schemas para que Mongoose los registre
import './schemas';

// ============================================
// EXPORTAR REPOSITORIOS
// ============================================
export * from './persistence';
