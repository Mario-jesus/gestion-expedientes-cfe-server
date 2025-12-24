/**
 * Validadores de formato para datos mexicanos
 * RFC, CURP, RPE, IMSS
 */

/**
 * Valida formato de RFC (12-13 caracteres alfanuméricos)
 * Ejemplos válidos: ABC123456789, ABC1234567890
 */
export function isValidRFC(rfc: string): boolean {
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  return rfcRegex.test(rfc.toUpperCase());
}

/**
 * Valida formato de CURP (18 caracteres)
 * Ejemplo: PEGJ850101HDFRRN01
 */
export function isValidCURP(curp: string): boolean {
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
  return curpRegex.test(curp.toUpperCase()) && curp.length === 18;
}

/**
 * Valida formato de RPE (Registro de Personal de Empleados)
 * Formato: RPE seguido de números (ej: RPE001234)
 */
export function isValidRPE(rpe: string): boolean {
  const rpeRegex = /^RPE\d+$/i;
  return rpeRegex.test(rpe);
}

/**
 * Valida formato de IMSS (11 dígitos)
 */
export function isValidIMSS(imss: string): boolean {
  const imssRegex = /^\d{11}$/;
  return imssRegex.test(imss);
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
