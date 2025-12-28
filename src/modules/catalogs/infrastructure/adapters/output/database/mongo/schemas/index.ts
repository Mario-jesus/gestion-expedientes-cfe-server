/**
 * Barrel export para todos los esquemas/modelos de Mongoose del módulo catalogs
 * 
 * Este archivo importa todos los esquemas para que Mongoose los registre
 * automáticamente cuando se importa este módulo.
 * 
 * IMPORTANTE: Los modelos se registran automáticamente cuando se importan
 * los archivos que los definen (al ejecutar model() o mongoose.model()).
 */

// ============================================
// ESQUEMAS/MODELOS DEL MÓDULO CATALOGS
// ============================================
// Importa aquí todos los esquemas de este módulo
import './AreaSchema';
import './AdscripcionSchema';
import './PuestoSchema';
import './DocumentTypeSchema';

// Los modelos se registran automáticamente al importar los archivos
// No necesitas exportar nada, solo importar

export {};
