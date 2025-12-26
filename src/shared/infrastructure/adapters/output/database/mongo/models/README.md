# Registro Centralizado de Modelos de Mongoose

Este directorio contiene el registro centralizado de todos los modelos de Mongoose del sistema.

## ¿Cómo funciona?

Mongoose registra modelos automáticamente cuando se importan los archivos que los definen. Este archivo (`index.ts`) importa todos los modelos para asegurar que estén disponibles cuando se use la conexión.

## Estructura

```
src/
├── shared/
│   └── infrastructure/
│       └── adapters/
│           └── output/
│               └── database/
│                   └── mongo/
│                       └── models/
│                           └── index.ts  ← Este archivo (registro centralizado)
└── modules/
    └── {modulo}/
        └── infrastructure/
            └── adapters/
                └── output/
                    └── database/
                        └── mongo/
                            ├── schemas/          ← Esquemas/modelos del módulo
                            │   ├── {Entity}Schema.ts  ← Schema y Model de Mongoose
                            │   └── index.ts       ← Barrel export de schemas
                            ├── persistence/      ← Repositorios del módulo
                            │   ├── {Entity}Repository.ts  ← Implementaciones de repositorios
                            │   └── index.ts
                            └── index.ts          ← Barrel export del módulo
```

## Agregar un nuevo modelo

1. **Crea el schema** en tu módulo:
   ```typescript
   // src/modules/mi-modulo/infrastructure/adapters/output/database/mongo/schemas/MiModeloSchema.ts
   import { Schema, model, Model, Document, Types } from 'mongoose';
   
   export interface MiModeloDocument extends Document {
     _id: Types.ObjectId;
     campo: string;
     createdAt: Date;
     updatedAt: Date;
   }
   
   const MiModeloSchema = new Schema<MiModeloDocument>({
     campo: { type: String, required: true },
   }, {
     timestamps: true,
     collection: 'mi_coleccion',
   });
   
   export const MiModelo: Model<MiModeloDocument> = 
     model<MiModeloDocument>('MiModelo', MiModeloSchema);
   ```

2. **Importa el schema** en el barrel export del módulo:
   ```typescript
   // src/modules/mi-modulo/infrastructure/adapters/output/database/mongo/schemas/index.ts
   import './MiModeloSchema';
   ```

3. **Importa el módulo** en el registro centralizado:
   ```typescript
   // src/shared/infrastructure/adapters/output/database/mongo/models/index.ts
   import '../../../../../../modules/mi-modulo/infrastructure/adapters/output/database/mongo';
   ```

4. **¡Listo!** El modelo estará disponible automáticamente cuando se use la conexión.

## Verificar modelos registrados

Puedes verificar que los modelos están registrados:

```typescript
import mongoose from 'mongoose';
import './models'; // Importar modelos

// Después de importar, verificar
console.log('Modelos registrados:', Object.keys(mongoose.models));
// Debería mostrar: ['Collaborator', 'User', ...]
```

O usando la conexión:

```typescript
import { getConnection } from '../mongoose';
import './models';

const connection = getConnection();
console.log('Modelos en conexión:', Object.keys(connection.models));
```

## Importante

- ⚠️ **Siempre importa los modelos ANTES de usar la conexión**
- ✅ El archivo `mongoose.ts` ya importa `./models` automáticamente
- ✅ Los modelos se registran cuando se importan los archivos que los definen
- ✅ No necesitas exportar nada en `index.ts`, solo importar

## Ejemplo de uso en un repositorio

```typescript
// src/modules/collaborators/infrastructure/adapters/output/database/mongo/persistence/CollaboratorRepository.ts
import { CollaboratorModel } from '../schemas/CollaboratorSchema';

export class CollaboratorRepository {
  async findById(id: string) {
    // El modelo ya está registrado por la importación en models/index.ts
    return CollaboratorModel.findById(id).exec();
  }
}
```
