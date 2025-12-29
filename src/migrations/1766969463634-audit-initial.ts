import { Connection } from 'mongoose';

/**
 * Migración: Crear índices iniciales para la colección log_entries
 * Fecha: 2025-01-28
 * 
 * Esta migración crea todos los índices necesarios para la colección log_entries:
 * - Índices simples: userId, action, entity, entityId, createdAt
 * - Índices compuestos:
 *   - userId + action
 *   - entity + entityId
 *   - userId + entity
 *   - action + entity
 *   - userId + entity + entityId
 *   - userId + createdAt (descendente)
 *   - entity + entityId + createdAt (descendente)
 *   - createdAt (ascendente y descendente)
 *   - userId + action + entity + createdAt (descendente)
 */
export async function up(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('log_entries');

  // 1. Índice simple para userId
  try {
    await collection.createIndex(
      { userId: 1 },
      { name: 'userId_1' }
    );
    console.log('✓ Índice creado: userId');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice userId ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 2. Índice simple para action
  try {
    await collection.createIndex(
      { action: 1 },
      { name: 'action_1' }
    );
    console.log('✓ Índice creado: action');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice action ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 3. Índice simple para entity
  try {
    await collection.createIndex(
      { entity: 1 },
      { name: 'entity_1' }
    );
    console.log('✓ Índice creado: entity');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice entity ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 4. Índice simple para entityId
  try {
    await collection.createIndex(
      { entityId: 1 },
      { name: 'entityId_1' }
    );
    console.log('✓ Índice creado: entityId');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice entityId ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 5. Índice simple para createdAt (ascendente - para filtros por rango)
  try {
    await collection.createIndex(
      { createdAt: 1 },
      { name: 'createdAt_1' }
    );
    console.log('✓ Índice creado: createdAt (ascendente)');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice createdAt (ascendente) ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 6. Índice simple para createdAt (descendente - para ordenamiento)
  try {
    await collection.createIndex(
      { createdAt: -1 },
      { name: 'createdAt_-1' }
    );
    console.log('✓ Índice creado: createdAt (descendente)');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice createdAt (descendente) ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 7. Índice compuesto: userId + action
  try {
    await collection.createIndex(
      { userId: 1, action: 1 },
      { name: 'userId_1_action_1' }
    );
    console.log('✓ Índice compuesto creado: userId + action');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto userId+action ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 8. Índice compuesto: entity + entityId
  try {
    await collection.createIndex(
      { entity: 1, entityId: 1 },
      { name: 'entity_1_entityId_1' }
    );
    console.log('✓ Índice compuesto creado: entity + entityId');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto entity+entityId ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 9. Índice compuesto: userId + entity
  try {
    await collection.createIndex(
      { userId: 1, entity: 1 },
      { name: 'userId_1_entity_1' }
    );
    console.log('✓ Índice compuesto creado: userId + entity');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto userId+entity ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 10. Índice compuesto: action + entity
  try {
    await collection.createIndex(
      { action: 1, entity: 1 },
      { name: 'action_1_entity_1' }
    );
    console.log('✓ Índice compuesto creado: action + entity');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto action+entity ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 11. Índice compuesto: userId + entity + entityId
  try {
    await collection.createIndex(
      { userId: 1, entity: 1, entityId: 1 },
      { name: 'userId_1_entity_1_entityId_1' }
    );
    console.log('✓ Índice compuesto creado: userId + entity + entityId');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto userId+entity+entityId ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 12. Índice compuesto: userId + createdAt (descendente)
  try {
    await collection.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_1_createdAt_-1' }
    );
    console.log('✓ Índice compuesto creado: userId + createdAt (descendente)');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto userId+createdAt ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 13. Índice compuesto: entity + entityId + createdAt (descendente)
  try {
    await collection.createIndex(
      { entity: 1, entityId: 1, createdAt: -1 },
      { name: 'entity_1_entityId_1_createdAt_-1' }
    );
    console.log('✓ Índice compuesto creado: entity + entityId + createdAt (descendente)');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto entity+entityId+createdAt ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 14. Índice compuesto: userId + action + entity + createdAt (descendente)
  try {
    await collection.createIndex(
      { userId: 1, action: 1, entity: 1, createdAt: -1 },
      { name: 'userId_1_action_1_entity_1_createdAt_-1' }
    );
    console.log('✓ Índice compuesto creado: userId + action + entity + createdAt (descendente)');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto userId+action+entity+createdAt ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  console.log('✅ Migración audit-initial completada exitosamente');
}

export async function down(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('log_entries');

  console.log('Revirtiendo migración audit-initial...');

  // Eliminar índices en orden inverso
  const indexesToDrop = [
    'userId_1_action_1_entity_1_createdAt_-1',
    'entity_1_entityId_1_createdAt_-1',
    'userId_1_createdAt_-1',
    'userId_1_entity_1_entityId_1',
    'action_1_entity_1',
    'userId_1_entity_1',
    'entity_1_entityId_1',
    'userId_1_action_1',
    'createdAt_-1',
    'createdAt_1',
    'entityId_1',
    'entity_1',
    'action_1',
    'userId_1',
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

  console.log('✅ Reversión de migración audit-initial completada');
}
