/**
 * Puerto de entrada (Input Port) para el caso de uso de eliminar adscripción
 */
export interface IDeleteAdscripcionUseCase {
  execute(adscripcionId: string, performedBy?: string): Promise<boolean>;
}
