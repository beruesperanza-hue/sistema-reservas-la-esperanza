import prisma from '@/lib/db';

/** Claves "seccion::nombre" de los ítems desactivados. Sin fila = activo. */
export async function obtenerItemsInactivos(): Promise<Set<string>> {
  const filas = await prisma.menuItemEstado.findMany({ where: { activo: false } });
  return new Set(filas.map((f) => `${f.seccion}::${f.nombre}`));
}

export function estaActivo(inactivos: Set<string>, seccion: string, nombre: string): boolean {
  return !inactivos.has(`${seccion}::${nombre}`);
}
