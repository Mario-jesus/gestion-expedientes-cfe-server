/**
 * Puerto de entrada (Input Port) para el caso de uso de eliminar puesto
 */
export interface IDeletePuestoUseCase {
  execute(puestoId: string, performedBy?: string): Promise<boolean>;
}
