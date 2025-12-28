/**
 * Puerto de entrada (Input Port) para el caso de uso de eliminar área
 */
export interface IDeleteAreaUseCase {
  execute(areaId: string, performedBy?: string): Promise<boolean>;
}
