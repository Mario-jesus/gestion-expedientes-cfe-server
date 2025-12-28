/**
 * Configuración global para tests
 * Este archivo se ejecuta antes de cada test
 */

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reducir logs en tests
process.env.LOG_TO_CONSOLE = 'false';
process.env.LOG_TO_FILE = 'false'; // Deshabilitar logging a archivo en tests
process.env.USE_MONGODB = 'false'; // Usar InMemoryDatabase y mocks
// Deshabilitar Loki en tests para evitar handles abiertos
delete process.env.LOKI_URL;
// Silenciar mensajes de dotenv
process.env.DOTENV_CONFIG_DEBUG = 'false';

// Interceptar console.log para silenciar mensajes promocionales de dotenv en tests
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  // Filtrar mensajes promocionales de dotenv
  if (message.includes('[dotenv@') && message.includes('] injecting env')) {
    return; // Silenciar estos mensajes
  }
  originalConsoleLog.apply(console, args);
};

// Timeout global para tests (puede ser sobrescrito en tests individuales)
jest.setTimeout(30000); // 30 segundos para tests E2E
