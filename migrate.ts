/**
 * Configuración para ts-migrate-mongoose
 * Este archivo es usado por ts-migrate-mongoose para ejecutar migraciones
 * 
 * Documentación: https://www.npmjs.com/package/ts-migrate-mongoose
 * 
 * Construye la URI de MongoDB desde variables de entorno usando el módulo de configuración centralizado
 */
import dotenv from 'dotenv';
import { config } from './src/shared/config';

// Cargar variables de entorno
dotenv.config();

// Obtener la URI de MongoDB desde el módulo de configuración centralizado
const uri = config.database.mongoUri;

export default {
  uri,
  collection: 'migrations',
  migrationsPath: './src/migrations',
  // templatePath: undefined, // Usar template por defecto (no necesario especificar)
  autosync: false,
};
