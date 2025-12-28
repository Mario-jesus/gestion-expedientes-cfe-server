/**
 * Barrel export para el módulo MongoDB del módulo catalogs
 * 
 * Este archivo importa todos los schemas para que se registren automáticamente
 * cuando se importa este módulo desde el registro centralizado de modelos.
 */

// Importar schemas para que se registren automáticamente
import './schemas';

// Re-exportar schemas y repositorios para fácil acceso desde otros lugares
export * from './schemas/AreaSchema';
export * from './schemas/AdscripcionSchema';
export * from './schemas/PuestoSchema';
export * from './schemas/DocumentTypeSchema';
export * from './persistence';
