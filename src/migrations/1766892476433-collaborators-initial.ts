import { Connection } from 'mongoose';

/**
 * Migración: Crear índices iniciales para la colección collaborators
 * Fecha: 2025-12-27
 * 
 * Esta migración crea todos los índices necesarios para la colección collaborators:
 * - Índice único: rpe
 * - Índices simples: areaId, adscripcionId, puestoId, isActive
 * - Índices compuestos:
 *   - areaId + isActive
 *   - adscripcionId + isActive
 *   - puestoId + isActive
 *   - tipoContrato + isActive
 *   - isActive + createdAt (descendente)
 *   - areaId + adscripcionId
 * - Índice de texto: búsqueda full-text en nombre, apellidos, rpe
 */
export async function up(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('collaborators');

  // 1. Índice único para rpe (Registro de Personal de Empleados)
  try {
    await collection.createIndex(
      { rpe: 1 },
      { unique: true, name: 'rpe_1' }
    );
    console.log('✓ Índice único creado: rpe');
  } catch (error: any) {
    if (error.code === 85) {
      // Índice ya existe con diferentes opciones
      console.log('⚠ Índice rpe ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 2. Índice simple para areaId
  try {
    await collection.createIndex(
      { areaId: 1 },
      { name: 'areaId_1' }
    );
    console.log('✓ Índice creado: areaId');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice areaId ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 3. Índice simple para adscripcionId
  try {
    await collection.createIndex(
      { adscripcionId: 1 },
      { name: 'adscripcionId_1' }
    );
    console.log('✓ Índice creado: adscripcionId');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice adscripcionId ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 4. Índice simple para puestoId
  try {
    await collection.createIndex(
      { puestoId: 1 },
      { name: 'puestoId_1' }
    );
    console.log('✓ Índice creado: puestoId');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice puestoId ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 5. Índice simple para isActive
  try {
    await collection.createIndex(
      { isActive: 1 },
      { name: 'isActive_1' }
    );
    console.log('✓ Índice creado: isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice isActive ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 6. Índice compuesto: areaId + isActive
  try {
    await collection.createIndex(
      { areaId: 1, isActive: 1 },
      { name: 'areaId_1_isActive_1' }
    );
    console.log('✓ Índice compuesto creado: areaId + isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto areaId+isActive ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 7. Índice compuesto: adscripcionId + isActive
  try {
    await collection.createIndex(
      { adscripcionId: 1, isActive: 1 },
      { name: 'adscripcionId_1_isActive_1' }
    );
    console.log('✓ Índice compuesto creado: adscripcionId + isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto adscripcionId+isActive ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 8. Índice compuesto: puestoId + isActive
  try {
    await collection.createIndex(
      { puestoId: 1, isActive: 1 },
      { name: 'puestoId_1_isActive_1' }
    );
    console.log('✓ Índice compuesto creado: puestoId + isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto puestoId+isActive ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 9. Índice compuesto: tipoContrato + isActive
  try {
    await collection.createIndex(
      { tipoContrato: 1, isActive: 1 },
      { name: 'tipoContrato_1_isActive_1' }
    );
    console.log('✓ Índice compuesto creado: tipoContrato + isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto tipoContrato+isActive ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 10. Índice compuesto: isActive + createdAt (descendente)
  try {
    await collection.createIndex(
      { isActive: 1, createdAt: -1 },
      { name: 'isActive_1_createdAt_-1' }
    );
    console.log('✓ Índice compuesto creado: isActive + createdAt');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto isActive+createdAt ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 11. Índice compuesto: areaId + adscripcionId (para validar relaciones)
  try {
    await collection.createIndex(
      { areaId: 1, adscripcionId: 1 },
      { name: 'areaId_1_adscripcionId_1' }
    );
    console.log('✓ Índice compuesto creado: areaId + adscripcionId');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto areaId+adscripcionId ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 12. Índice de texto para búsqueda full-text (nombre, apellidos, rpe)
  try {
    await collection.createIndex(
      { nombre: 'text', apellidos: 'text', rpe: 'text' },
      { name: 'collaborator_text_search' }
    );
    console.log('✓ Índice de texto creado: collaborator_text_search');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice de texto ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  console.log('✅ Migración collaborators-initial completada exitosamente');
}

export async function down(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('collaborators');

  console.log('Revirtiendo migración collaborators-initial...');

  // Eliminar índices en orden inverso
  const indexesToDrop = [
    'collaborator_text_search',
    'areaId_1_adscripcionId_1',
    'isActive_1_createdAt_-1',
    'tipoContrato_1_isActive_1',
    'puestoId_1_isActive_1',
    'adscripcionId_1_isActive_1',
    'areaId_1_isActive_1',
    'isActive_1',
    'puestoId_1',
    'adscripcionId_1',
    'areaId_1',
    'rpe_1',
  ];

  for (const indexName of indexesToDrop) {
    try {
      await collection.dropIndex(indexName);
      console.log(`✓ Índice eliminado: ${indexName}`);
    } catch (error: any) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log(`⚠ Índice ${indexName} no existe, omitiendo...`);
      } else {
        throw error;
      }
    }
  }

  console.log('✅ Reversión de migración collaborators-initial completada');
}
