# Logger

Implementación de logging usando Pino con soporte para Loki mediante `pino-loki`.

## Implementación

### PinoLogger
Logger avanzado usando Pino con soporte para:
- Logging estructurado en JSON
- Envío de logs a Loki (pino-loki)
- Configuración de niveles (trace, debug, info, warn, error, fatal)
- Batching automático de logs
- Labels estáticas para LogQL queries

## Uso

### Básico

```typescript
import { createLogger } from './shared/infrastructure';

const logger = createLogger();
logger.info('Application started');
```

### Con configuración

```typescript
import { createLogger } from './shared/infrastructure';

const logger = createLogger({
  pino: {
    level: 'debug',
    environment: 'production',
    loki: {
      url: 'http://localhost:3100',
      labels: {
        service: 'api',
      },
      batching: true,
      interval: 5,
    },
  },
});
```

### Desde variables de entorno (Recomendado)

```typescript
import { createLoggerFromEnv } from './shared/infrastructure';

const logger = createLoggerFromEnv();
```

## Variables de Entorno

```env
# Nivel de logging (trace, debug, info, warn, error, fatal)
LOG_LEVEL=info

# Entorno de ejecución
NODE_ENV=development

# Configuración de Loki (opcional)
# URL completa de Loki (local o remoto/Grafana Cloud)
LOKI_URL=http://localhost:3100

# Labels adicionales estáticas (JSON, opcional)
# Nota: Usar pocas labels estáticas (app, env, service)
# NO usar variables dinámicas como userId, orderId como labels
LOKI_LABELS={"service":"api"}

# Batching: agrupa logs antes de enviar (default: true)
LOKI_BATCHING=true

# Intervalo en segundos para enviar logs (default: 5)
LOKI_INTERVAL=5

# Autenticación básica para Loki protegido (Grafana Cloud, etc.)
# LOKI_BASIC_AUTH_USERNAME=username
# LOKI_BASIC_AUTH_PASSWORD=token_or_password
```

## Buenas Prácticas

### Labels en Loki
- ✅ Usar pocas labels estáticas: `app`, `env`, `service`
- ❌ NO usar variables dinámicas como `userId`, `orderId` como labels
- ✅ Variables dinámicas van dentro del JSON del log, no como labels

### Niveles de Log
- `trace`: Información muy detallada (solo desarrollo)
- `debug`: Información de debugging
- `info`: Flujo normal de la aplicación
- `warn`: Situaciones inusuales que no son errores
- `error`: Errores que requieren atención
- `fatal`: Errores críticos que pueden detener la aplicación

### Ejemplos de Uso

```typescript
// Log simple
logger.info('Usuario autenticado');

// Log con metadata
logger.info({ userId: 123, email: 'user@example.com' }, 'Usuario logueado');

// Log de error
logger.error({ err: new Error('Database connection failed') }, 'Error de conexión');

// Log con contexto
logger.warn({ route: '/clientes', duration: 5000 }, 'Respuesta lenta');
```

## Verificación

Para verificar que los logs se están enviando a Loki:

1. Asegúrate de que Loki está corriendo y accesible:
   ```bash
   curl http://localhost:3100/ready
   ```

2. Ejecuta tu aplicación y genera algunos logs

3. En Grafana/Loki, ejecuta una query LogQL:
   ```
   {app="gestion-expedientes-cfe-server", env="dev"}
   ```

## Características

- ✅ Logging estructurado en JSON
- ✅ Integración con Loki para agregación de logs
- ✅ Batching automático de logs (reduce llamadas HTTP)
- ✅ Soporte para diferentes niveles
- ✅ Manejo de errores con stack traces
- ✅ Metadata contextual
- ✅ Soporte para autenticación básica (Grafana Cloud)

