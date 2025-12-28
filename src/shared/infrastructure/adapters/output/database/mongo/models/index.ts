/**
 * Registro centralizado de todos los modelos de Mongoose
 * 
 * IMPORTANTE: Este archivo importa todos los esquemas desde los módulos
 * para que Mongoose los registre automáticamente antes de que se use la conexión.
 * 
 * Los modelos se registran automáticamente cuando se importan los archivos
 * que los definen (al ejecutar model() o mongoose.model()).
 * 
 * Estructura:
 * - Los esquemas/modelos están en: modules/{modulo}/infrastructure/adapters/output/database/mongo/
 * - Este archivo los importa todos para registro centralizado
 * 
 * Para agregar un nuevo modelo:
 * 1. Crea el schema en: modules/{modulo}/infrastructure/adapters/output/database/mongo/schemas/{Entity}Schema.ts
 * 2. Importa el schema en: modules/{modulo}/infrastructure/adapters/output/database/mongo/schemas/index.ts
 * 3. Importa el módulo aquí: import '../../../../modules/{modulo}/infrastructure/adapters/output/database/mongo';
 */

// ============================================
// IMPORTAR TODOS LOS ESQUEMAS DE MÓDULOS
// ============================================
// Importa todos los esquemas desde los módulos
// Los modelos se registran automáticamente al importar los archivos

// Módulo: users
import '../../../../../../../modules/users/infrastructure/adapters/output/database/mongo';

// Módulo: auth
import '../../../../../../../modules/auth/infrastructure/adapters/output/database/mongo';

export {}; // Para que TypeScript lo trate como módulo
