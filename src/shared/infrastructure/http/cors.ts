import type { CorsOptions } from 'cors';
import type { CorsConfig } from '../../config/types';

/**
 * Construye las opciones de CORS a partir de la configuración centralizada
 */
export function buildCorsOptions(corsConfig: CorsConfig): CorsOptions {
  const options: CorsOptions = {
    credentials: corsConfig.credentials,
    methods: corsConfig.methods,
    allowedHeaders: corsConfig.allowedHeaders,
    exposedHeaders: corsConfig.exposedHeaders.length > 0 ? corsConfig.exposedHeaders : undefined,
    maxAge: corsConfig.maxAge,
  };

  // Configurar origen
  if (corsConfig.allowAll) {
    // Permitir todos los orígenes (solo desarrollo)
    options.origin = true;
  } else if (corsConfig.origins.length === 0) {
    // Si no hay orígenes configurados, permitir todos (fallback)
    options.origin = true;
  } else {
    // Un solo origen o múltiples orígenes - usar función de validación
    // Esto permite control explícito sobre peticiones sin origin (herramientas de desarrollo)
    options.origin = (origin, callback) => {
      // Permitir requests sin origin (ej: Postman, Insomnia, curl, herramientas de desarrollo)
      // Esto es útil para desarrollo y testing, pero en producción deberías considerar
      // restringir esto si quieres forzar que todas las peticiones vengan de navegadores
      if (!origin) {
        return callback(null, true);
      }

      // Validar que el origen esté en la lista permitida
      if (corsConfig.origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS. Origin "${origin}" is not in the allowed list: ${corsConfig.origins.join(', ')}`));
      }
    };
  }

  return options;
}
