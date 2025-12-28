import type { Connection } from 'mongoose';

/**
 * Migración: Crear índices iniciales para la colección refresh_tokens
 * Fecha: 2025-01-26
 * 
 * Esta migración crea todos los índices necesarios para la colección refresh_tokens:
 * - Índice único: token
 * - Índices simples: userId, isRevoked
 * - Índice TTL: expiresAt (elimina automáticamente documentos expirados)
 * - Índices compuestos:
 *   - userId + isRevoked + expiresAt (búsqueda de tokens activos de un usuario)
 *   - expiresAt + isRevoked (limpieza de tokens expirados y revocados)
 *   - userId + isRevoked (búsqueda de tokens por usuario y estado)
 */
export async function up(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('refresh_tokens');

  // 1. Índice único para token
  try {
    await collection.createIndex(
      { token: 1 },
      { unique: true, name: 'token_1' }
    );
    console.log('✓ Índice único creado: token');
  } catch (error: any) {
    if (error.code === 85) {
      // Índice ya existe con diferentes opciones
      console.log('⚠ Índice token ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 2. Índice simple para userId
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

  // 3. Índice TTL para expiresAt (elimina automáticamente documentos expirados)
  try {
    await collection.createIndex(
      { expiresAt: 1 },
      { 
        expireAfterSeconds: 0, // Eliminar inmediatamente cuando expire
        name: 'expiresAt_1' 
      }
    );
    console.log('✓ Índice TTL creado: expiresAt (expireAfterSeconds: 0)');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice expiresAt ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 4. Índice simple para isRevoked
  try {
    await collection.createIndex(
      { isRevoked: 1 },
      { name: 'isRevoked_1' }
    );
    console.log('✓ Índice creado: isRevoked');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice isRevoked ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 5. Índice compuesto: userId + isRevoked + expiresAt
  // Útil para búsquedas de tokens activos de un usuario (no revocados y no expirados)
  try {
    await collection.createIndex(
      { userId: 1, isRevoked: 1, expiresAt: 1 },
      { name: 'userId_1_isRevoked_1_expiresAt_1' }
    );
    console.log('✓ Índice compuesto creado: userId + isRevoked + expiresAt');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto userId+isRevoked+expiresAt ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 6. Índice compuesto: expiresAt + isRevoked
  // Útil para limpieza de tokens expirados y revocados
  try {
    await collection.createIndex(
      { expiresAt: 1, isRevoked: 1 },
      { name: 'expiresAt_1_isRevoked_1' }
    );
    console.log('✓ Índice compuesto creado: expiresAt + isRevoked');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto expiresAt+isRevoked ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 7. Índice compuesto: userId + isRevoked
  // Útil para búsqueda de tokens por usuario y estado
  try {
    await collection.createIndex(
      { userId: 1, isRevoked: 1 },
      { name: 'userId_1_isRevoked_1' }
    );
    console.log('✓ Índice compuesto creado: userId + isRevoked');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto userId+isRevoked ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  console.log('✅ Migración auth-refresh-tokens-initial completada exitosamente');
}

export async function down(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('refresh_tokens');

  console.log('Revirtiendo migración auth-refresh-tokens-initial...');

  // Eliminar índices en orden inverso
  const indexesToDrop = [
    'userId_1_isRevoked_1',
    'expiresAt_1_isRevoked_1',
    'userId_1_isRevoked_1_expiresAt_1',
    'isRevoked_1',
    'expiresAt_1',
    'userId_1',
    'token_1',
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

  console.log('✅ Reversión de migración auth-refresh-tokens-initial completada');
}
