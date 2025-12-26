/**
 * Barrel export para los esquemas/modelos y repositorios de Mongoose del módulo users
 * 
 * Este archivo importa todos los esquemas para que Mongoose los registre
 * automáticamente. Debe ser importado en el registro centralizado de modelos.
 */

// Importar todos los esquemas del módulo
// Esto registra automáticamente los modelos en Mongoose
import './schemas';

// Re-exportar esquemas y repositorios para fácil acceso desde otros lugares
export * from './schemas/UserSchema';
export * from './persistence';
