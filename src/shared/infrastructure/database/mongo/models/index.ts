/**
 * Registro centralizado de todos los modelos de Mongoose
 * 
 * IMPORTANTE: Importa todos los modelos aquí para que Mongoose los registre
 * automáticamente antes de que se use la conexión.
 * 
 * Los modelos se registran automáticamente cuando se importan los archivos
 * que los definen (al ejecutar model() o mongoose.model()).
 * 
 * Estructura esperada:
 * - src/modules/{modulo}/infrastructure/persistence/{Entity}Model.ts
 * 
 * Ejemplo de uso:
 * ```typescript
 * import '../../../../modules/collaborators/infrastructure/persistence/CollaboratorModel';
 * import '../../../../modules/users/infrastructure/persistence/UserModel';
 * ```
 */

// ============================================
// MODELOS DE MÓDULOS
// ============================================
// Importa aquí todos los modelos de tus módulos
// Ejemplo:
// import '../../../../modules/collaborators/infrastructure/persistence/CollaboratorModel';
// import '../../../../modules/users/infrastructure/persistence/UserModel';
// import '../../../../modules/areas/infrastructure/persistence/AreaModel';

// Los modelos se registran automáticamente al importar los archivos
// No necesitas exportar nada, solo importar

export {}; // Para que TypeScript lo trate como módulo
