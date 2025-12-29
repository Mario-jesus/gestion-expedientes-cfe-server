/**
 * Tipos de acciones que se registran en los logs de auditoría
 */
export enum LogAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  VIEW = 'view',
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  LOGIN = 'login',
  LOGOUT = 'logout',
  REFRESH_TOKEN = 'refresh_token',
  CHANGE_PASSWORD = 'change_password',
}
