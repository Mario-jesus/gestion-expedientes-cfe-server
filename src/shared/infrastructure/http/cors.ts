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
  } else if (corsConfig.origins.length === 1) {
    // Un solo origen
    options.origin = corsConfig.origins[0];
  } else {
    // Múltiples orígenes - usar función de validación
    options.origin = (origin, callback) => {
      if (!origin) {
        // Permitir requests sin origin (ej: Postman, curl)
        return callback(null, true);
      }

      if (corsConfig.origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    };
  }

  return options;
}
