// Carta actualizada — Menú Aniversario 15 años (cargada 2026-07-27).
// Fuente: PDF de diseño provisto por el restaurante. Precios en ARS.

export interface Plato {
  nombre: string;
  descripcion?: string;
  nueva?: boolean;
  tapa?: number;
  racion?: number;
  precio?: number;
}

export interface Combo {
  nombre: string;
  incluye: string;
  precio: number;
  precioSuelto: number;
  vegetariano?: boolean;
}

export interface ItemBebida {
  nombre: string;
  precio: number;
}

export const TORTILLAS: Plato[] = [
  { nombre: 'Tortilla de papas', tapa: 13500, racion: 19200 },
  { nombre: 'Tortilla con alioli y taquitos de jamón', nueva: true, tapa: 14700, racion: 20900 },
  { nombre: 'Tortilla de papas, cherry salteados y camembert', nueva: true, tapa: 16000, racion: 23300 },
];

export const TAPAS_Y_RACIONES: Plato[] = [
  { nombre: 'Papas bravas', tapa: 8800, racion: 14800 },
  { nombre: 'Croquetas de jamón (2/4 ud.)', tapa: 10800, racion: 18600 },
  { nombre: 'Triolet: pollo escabeche, zanahorias al curry y olivas', tapa: 11600 },
  { nombre: 'Buñuelos de acelga con muzzarella (2/4 ud.)', tapa: 11600, racion: 21200 },
  { nombre: 'Ensalada veggie: rúcula, pimientos, cherry salteado, zanahoria, olivas, cebolla encurtida y cilantro', tapa: 12800, racion: 19600 },
  { nombre: 'Pincho moruno con puré de berenjenas', tapa: 15900, racion: 24900 },
  { nombre: 'Pollo al aglio con papas españolas', tapa: 16200, racion: 26900 },
  { nombre: 'Cerdo cabrales con batatas', tapa: 16900, racion: 27000 },
  { nombre: 'Huevos rotos veggies con pimientos y queso azul', nueva: true, tapa: 17200, racion: 28500 },
  { nombre: 'Provoleta con tomate y pesto', racion: 20700 },
  { nombre: 'Camembert frito con salsa de arándanos', racion: 21700 },
  { nombre: 'Burrata: rúcula, cebolla encurtida, pepinos agridulces y cherry salteados', racion: 23400 },
  { nombre: 'Ojo de bife (300 gr) con salsa de pimiento y huevo frito', racion: 35000 },
];

export const CLASICOS_DE_MAR: Plato[] = [
  { nombre: 'Rabas', tapa: 16200, racion: 29700 },
  { nombre: 'Huevos rotos con gambas al ajillo', tapa: 22000, racion: 36000 },
  { nombre: 'Gambas al ajillo o al azafrán', tapa: 20000, racion: 29000 },
];

export const ARROCES: Plato[] = [
  { nombre: 'Paella valenciana: pollo, cerdo, chauchas y romero', precio: 41400 },
  { nombre: 'Arroz con gambas y calamares', precio: 48000 },
];

export const POSTRES: Plato[] = [
  { nombre: 'Flan con dulce de leche', precio: 9600 },
  { nombre: 'Panqueque de dulce de leche', precio: 9800 },
  { nombre: 'Torta de queso vasca', precio: 12200 },
];

export const HORA_DEL_VERMUT: ItemBebida[] = [
  { nombre: '2 Vermut + Triolet', precio: 18700 },
  { nombre: 'Vermú + tapa de croquetas + tapa de papas bravas', precio: 26000 },
];

export const DE_GRIFO: ItemBebida[] = [
  { nombre: 'Caña Imperial 350 cm³', precio: 7500 },
  { nombre: 'Caña Sidra 1888', precio: 7500 },
];

export const VERMUT_Y_CUBATAS: ItemBebida[] = [
  { nombre: 'Vaso de vermut rosso con pomelo o soda', precio: 7700 },
  { nombre: 'Aperisidra: Cynar, sidra 1888 y pomelo', precio: 7700 },
  { nombre: 'Copa de tinto verano', precio: 8200 },
  { nombre: 'Ferroviario: rosso, fernet y soda', precio: 9200 },
  { nombre: 'Cynar con pomelo o naranja', precio: 9800 },
  { nombre: 'Campari con naranja o tónica', precio: 10500 },
  { nombre: 'Aperol Spritz', precio: 13100 },
  { nombre: 'Fernet con coca', precio: 13100 },
  { nombre: 'Negroni', precio: 14700 },
  { nombre: 'Vinos por copa', precio: 6800 },
];

export const SIN_ALCOHOL: ItemBebida[] = [
  { nombre: 'Gaseosas', precio: 6000 },
  { nombre: 'Aguas o sifón', precio: 5800 },
  { nombre: 'Café (cápsula)', precio: 5400 },
];

export const VINITOS: ItemBebida[] = [
  { nombre: 'Alamos Malbec', precio: 18000 },
  { nombre: 'Chateaux Subsónico Blanco', precio: 23000 },
  { nombre: 'Nicasia Cabernet Franc', precio: 20000 },
  { nombre: 'Saint Felicien Cabernet Sauvignon', precio: 24000 },
];

// "Comen 2, pican 4" — combos para compartir, nombrados como barrios de Madrid.
// precioSuelto = suma real de precios tapa de cada ítem incluido (lib/carta.ts,
// no un número aparte) — actualizado 2026-07-27 junto con ingredientes y precio.
export const ESPE_COMBOS: Combo[] = [
  {
    nombre: 'Atocha',
    incluye: 'Papas bravas, croquetas de jamón, Triolet, buñuelos y pincho moruno',
    precio: 50000,
    precioSuelto: 58700,
  },
  {
    nombre: 'Sol',
    incluye: 'Tortilla de camembert, ensalada veggie, buñuelos y papas bravas',
    precio: 45000,
    precioSuelto: 49200,
    vegetariano: true,
  },
  {
    nombre: 'Chueca',
    incluye: 'Tortilla de papas, pincho moruno, pollo al aglio y rabas',
    precio: 58000,
    precioSuelto: 61800,
  },
  {
    nombre: 'Chamartín',
    incluye: 'Tortilla cherry/camembert, huevos rotos con gambas al ajillo, rabas y cerdo cabrales',
    precio: 65000,
    precioSuelto: 71100,
  },
];

export const RECETA_DEL_MES = 'Gambas al ajillo';

export function formatearPrecio(valor: number): string {
  return `$${valor.toLocaleString('es-AR')}`;
}
