import { Connection } from 'mongoose';

/**
 * Migración: Crear índices iniciales para la colección users
 * Fecha: 2025-12-25
 * 
 * Esta migración crea todos los índices necesarios para la colección users:
 * - Índices únicos: username, email
 * - Índices simples: isActive
 * - Índices compuestos: role+isActive, isActive+createdAt
 * - Índice de texto: búsqueda full-text en username, email, name
 */
export async function up(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('users');

  // 1. Índice único para username
  try {
    await collection.createIndex(
      { username: 1 },
      { unique: true, name: 'username_1' }
    );
    console.log('✓ Índice único creado: username');
  } catch (error: any) {
    if (error.code === 85) {
      // Índice ya existe con diferentes opciones
      console.log('⚠ Índice username ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 2. Índice único para email
  try {
    await collection.createIndex(
      { email: 1 },
      { unique: true, name: 'email_1' }
    );
    console.log('✓ Índice único creado: email');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice email ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 3. Índice simple para isActive
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

  // 4. Índice compuesto: role + isActive
  try {
    await collection.createIndex(
      { role: 1, isActive: 1 },
      { name: 'role_1_isActive_1' }
    );
    console.log('✓ Índice compuesto creado: role + isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto role+isActive ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 5. Índice compuesto: isActive + createdAt (descendente)
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

  // 6. Índice de texto para búsqueda full-text
  try {
    await collection.createIndex(
      { username: 'text', email: 'text', name: 'text' },
      { name: 'user_text_search' }
    );
    console.log('✓ Índice de texto creado: user_text_search');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice de texto ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  console.log('✅ Migración users-initial completada exitosamente');
}

export async function down(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('users');

  console.log('Revirtiendo migración users-initial...');

  // Eliminar índices en orden inverso
  const indexesToDrop = [
    'user_text_search',
    'isActive_1_createdAt_-1',
    'role_1_isActive_1',
    'isActive_1',
    'email_1',
    'username_1',
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

  console.log('✅ Reversión de migración users-initial completada');
}
