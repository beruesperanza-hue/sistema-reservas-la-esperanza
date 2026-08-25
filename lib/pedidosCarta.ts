// Catálogo de lo que se puede pedir online: toda la carta (lib/carta.ts),
// con las mismas secciones/slugs que ya usa /carta y el admin para
// activar/desactivar ítems (lib/menuDisponibilidad.ts). Vive separado de
// SECCIONES_MENU porque acá necesitamos los tipos completos (tapa/ración/precio)
// para calcular precios reales, no solo el nombre.

import {
  TORTILLAS,
  TAPAS_Y_RACIONES,
  CLASICOS_DE_MAR,
  ARROCES,
  POSTRES,
  HORA_DEL_VERMUT,
  DE_GRIFO,
  VERMUT_Y_CUBATAS,
  SIN_ALCOHOL,
  VINITOS,
  ESPE_COMBOS,
  type Plato,
  type ItemBebida,
  type Combo,
} from '@/lib/carta';

export type ItemPedible = Plato | ItemBebida | Combo;
export type Variante = 'tapa' | 'racion';

export const CATALOGO_PEDIDOS: Record<string, ItemPedible[]> = {
  tortillas: TORTILLAS,
  tapas_raciones: TAPAS_Y_RACIONES,
  clasicos_mar: CLASICOS_DE_MAR,
  arroces: ARROCES,
  postres: POSTRES,
  hora_vermut: HORA_DEL_VERMUT,
  de_grifo: DE_GRIFO,
  vermut_cubatas: VERMUT_Y_CUBATAS,
  sin_alcohol: SIN_ALCOHOL,
  vinitos: VINITOS,
  espe_combos: ESPE_COMBOS,
};

export function buscarItemPedible(seccion: string, nombre: string): ItemPedible | undefined {
  return CATALOGO_PEDIDOS[seccion]?.find((it) => it.nombre === nombre);
}

/**
 * Si el ítem tiene precios por tapa/ración, hay que elegir variante. Si tiene
 * un único `precio`, no. Devuelve null cuando la combinación no es válida
 * (ej. pedir "tapa" de algo que solo tiene ración).
 */
export function precioDeItem(item: ItemPedible, variante?: Variante): number | null {
  const p = item as Plato;
  if (p.tapa !== undefined || p.racion !== undefined) {
    if (variante === 'tapa') return p.tapa ?? null;
    if (variante === 'racion') return p.racion ?? null;
    return null;
  }
  return (item as ItemBebida | Combo).precio ?? null;
}

/** Variantes disponibles de un ítem, para la UI. null = precio único (sin variante). */
export function variantesDeItem(item: ItemPedible): { variante: Variante; label: string; precio: number }[] | null {
  const p = item as Plato;
  if (p.tapa === undefined && p.racion === undefined) return null;
  const variantes: { variante: Variante; label: string; precio: number }[] = [];
  if (p.tapa !== undefined) variantes.push({ variante: 'tapa', label: 'Tapa', precio: p.tapa });
  if (p.racion !== undefined) variantes.push({ variante: 'racion', label: 'Ración', precio: p.racion });
  return variantes;
}

export function nombreConVariante(nombre: string, variante?: Variante): string {
  if (variante === 'tapa') return `${nombre} (Tapa)`;
  if (variante === 'racion') return `${nombre} (Ración)`;
  return nombre;
}
