/**
 * Generador de IDs únicos
 * Usa crypto.randomUUID (Node.js 14.17+)
 * Fallback a generación manual si no está disponible
 */

/**
 * Genera un ID único usando crypto.randomUUID
 * Fallback a generación basada en timestamp y random
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: generar ID simple basado en timestamp y random
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
