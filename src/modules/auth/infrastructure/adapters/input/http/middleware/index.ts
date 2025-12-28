/**
 * Barrel export para middlewares HTTP del módulo auth
 * 
 * NOTA: Los middlewares authenticate y authorize ahora están en shared/infrastructure
 * Se mantienen estos exports para compatibilidad, pero se recomienda importar desde @shared/infrastructure
 */

export { authenticate, authorize } from '@shared/infrastructure';
