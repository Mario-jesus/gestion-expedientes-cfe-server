/**
 * Barrel export para el módulo MongoDB del módulo audit
 * 
 * Este archivo importa todos los schemas para que se registren automáticamente
 * cuando se importa este módulo desde el registro centralizado de modelos.
 */

// Importar schemas para que se registren automáticamente
import './schemas';

// Re-exportar schemas y repositorios para fácil acceso desde otros lugares
export * from './schemas';
export * from './persistence';
