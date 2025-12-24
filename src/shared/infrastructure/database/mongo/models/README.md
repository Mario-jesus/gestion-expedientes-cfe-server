# Registro Centralizado de Modelos de Mongoose

Este directorio contiene el registro centralizado de todos los modelos de Mongoose del sistema.

## ¿Cómo funciona?

Mongoose registra modelos automáticamente cuando se importan los archivos que los definen. Este archivo (`index.ts`) importa todos los modelos para asegurar que estén disponibles cuando se use la conexión.

## Estructura

```
src/
├── shared/
│   └── infrastructure/
│       └── database/
│           └── mongo/
│               └── models/
│                   └── index.ts  ← Este archivo (registro centralizado)
└── modules/
    └── {modulo}/
        └── infrastructure/
            └── persistence/
                └── {Entity}Model.ts  ← Modelos de cada módulo
```

## Agregar un nuevo modelo

1. **Crea el modelo** en tu módulo:
   ```typescript
   // src/modules/mi-modulo/infrastructure/persistence/MiModelo.ts
   import { Schema, model, Model, Document } from 'mongoose';
   
   export interface MiModeloDocument extends Document {
     campo: string;
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

2. **Importa el modelo** en `index.ts`:
   ```typescript
   // src/shared/infrastructure/database/mongo/models/index.ts
   import '../../../../modules/mi-modulo/infrastructure/persistence/MiModelo';
   ```

3. **¡Listo!** El modelo estará disponible automáticamente cuando se use la conexión.

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
// src/modules/collaborators/infrastructure/persistence/CollaboratorRepository.ts
import { CollaboratorModel } from './CollaboratorModel';

export class CollaboratorRepository {
  async findById(id: string) {
    // El modelo ya está registrado por la importación en models/index.ts
    return CollaboratorModel.findById(id).exec();
  }
}
```
