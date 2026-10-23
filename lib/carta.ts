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
  { nombre: 'Tortilla de papas', tapa: 14200, racion: 20000 },
  { nombre: 'Tortilla con alioli y taquitos de jamón', nueva: true, tapa: 15400, racion: 22000 },
  { nombre: 'Tortilla de papas, cherry salteados y camembert', nueva: true, tapa: 16800, racion: 24500 },
];

export const TAPAS_Y_RACIONES: Plato[] = [
  { nombre: 'Papas bravas', tapa: 9200, racion: 15500 },
  { nombre: 'Croquetas de jamón (2/4 ud.)', tapa: 11300, racion: 19500 },
  { nombre: 'Triolet: pollo escabeche, zanahorias al curry y olivas', tapa: 12200 },
  { nombre: 'Buñuelos de acelga con muzzarella (2/4 ud.)', tapa: 12200, racion: 22500 },
  { nombre: 'Ensalada veggie: rúcula, champiñones salteados, cherry salteado, zanahoria, olivas, cebolla encurtida y cilantro', tapa: 13400, racion: 19600 },
  { nombre: 'Pincho moruno con puré de berenjenas', tapa: 16700, racion: 26000 },
  { nombre: 'Pollo al aglio con papas españolas', tapa: 17000, racion: 28000 },
  { nombre: 'Cerdo cabrales con batatas', tapa: 17700, racion: 28500 },
  { nombre: 'Huevos rotos veggies con champiñones provenzal y queso azul', nueva: true, tapa: 18100, racion: 30000 },
  { nombre: 'Provoleta con tomate y pesto', racion: 21500 },
  { nombre: 'Camembert frito con salsa de arándanos', racion: 23000 },
  { nombre: 'Burrata: rúcula, cebolla encurtida, pepinos agridulces y cherry salteados', racion: 24500 },
  { nombre: 'Ojo de bife (300 gr) con lechuga a la plancha y huevo frito', racion: 37000 },
];

export const CLASICOS_DE_MAR: Plato[] = [
  { nombre: 'Rabas', tapa: 17000, racion: 31000 },
  { nombre: 'Huevos rotos con gambas al ajillo', tapa: 23000, racion: 38000 },
  { nombre: 'Gambas al ajillo o al azafrán', racion: 30500 },
];

export const ARROCES: Plato[] = [
  { nombre: 'Paella valenciana: pollo, cerdo, chauchas y romero', precio: 43500 },
  { nombre: 'Arroz con gambas y calamares', precio: 50500 },
];

export const POSTRES: Plato[] = [
  { nombre: 'Flan con dulce de leche', precio: 10100 },
  { nombre: 'Panqueque de dulce de leche', precio: 10300 },
  { nombre: 'Torta de queso vasca', precio: 12800 },
];

export const HORA_DEL_VERMUT: ItemBebida[] = [
  { nombre: '2 Vermut + Triolet', precio: 22000 },
  { nombre: 'Vermú + tapa de croquetas + tapa de papas bravas', precio: 27500 },
];

export const DE_GRIFO: ItemBebida[] = [
  { nombre: 'Caña Imperial 350 cm³', precio: 8600 },
  { nombre: 'Caña Sidra 1888', precio: 8600 },
];

export const VERMUT_Y_CUBATAS: ItemBebida[] = [
  { nombre: 'Vaso de vermut rosso con pomelo o soda', precio: 8100 },
  { nombre: 'Aperisidra: Cynar, sidra 1888 y pomelo', precio: 8100 },
  { nombre: 'Copa de tinto verano', precio: 8600 },
  { nombre: 'Ferroviario: rosso, fernet y soda', precio: 9700 },
  { nombre: 'Cynar con pomelo o naranja', precio: 10300 },
  { nombre: 'Campari con naranja o tónica', precio: 11000 },
  { nombre: 'Aperol Spritz', precio: 13800 },
  { nombre: 'Fernet con coca', precio: 13800 },
  { nombre: 'Gin Tonic', precio: 14700 },
  { nombre: 'Negroni', precio: 15800 },
  { nombre: 'Negroni Sbagliato: Vermouth Rosso, Campari y Espumante', precio: 15400 },
  { nombre: 'Vinos por copa: Alma Mora Malbec', precio: 7100 },
];

export const SIN_ALCOHOL: ItemBebida[] = [
  { nombre: 'Gaseosas', precio: 6300 },
  { nombre: 'Aguas o sifón', precio: 6100 },
  { nombre: 'Café (cápsula)', precio: 5700 },
];

export const VINITOS: ItemBebida[] = [
  { nombre: 'Alamos Malbec', precio: 21000 },
  { nombre: 'Nicasia Blanco', precio: 21000 },
  { nombre: 'Nicasia Cabernet Franc', precio: 23000 },
  { nombre: 'Tierra del Fuego Red Blend', precio: 23000 },
  { nombre: 'Chateaux Subsónico Blanco', precio: 24000 },
  { nombre: 'El Porvenir Amauta Torrontés', precio: 24000 },
  { nombre: 'Fabre Montmayou Reserva', precio: 24000 },
  { nombre: 'Perro Callejero Pinot Noir', precio: 24000 },
  { nombre: 'Humberto Canale Blush Rosé', precio: 25000 },
  { nombre: 'Losance Rosé', precio: 25000 },
  { nombre: 'Saint Felicien Cabernet Sauvignon', precio: 26500 },
  { nombre: 'Serbal Sauvignon Blanc', precio: 26500 },
  { nombre: 'DV Catena Cabernet-Malbec', precio: 29500 },
  { nombre: 'Ferus Blanc de Blancs', precio: 29500 },
  { nombre: 'Sapo de otro pozo Malbec', precio: 31500 },
  { nombre: 'Chateaux Subsónico Blend o Malbec', precio: 37000 },
  { nombre: 'San Pedro de Yacochuya 2021', precio: 56500 },
];

// "Comen 2, pican 4" — combos para compartir, nombrados como barrios de Madrid.
// precioSuelto = suma real de precios tapa de cada ítem incluido (lib/carta.ts,
// no un número aparte) — actualizado 2026-07-27 junto con ingredientes y precio.
export const ESPE_COMBOS: Combo[] = [
  {
    nombre: 'Atocha',
    incluye: 'Papas bravas, croquetas de jamón, Triolet, buñuelos y pincho moruno',
    precio: 52500,
    precioSuelto: 61600,
  },
  {
    nombre: 'Sol',
    incluye: 'Tortilla de camembert, ensalada veggie, buñuelos y papas bravas',
    precio: 47500,
    precioSuelto: 51600,
    vegetariano: true,
  },
  {
    nombre: 'Chueca',
    incluye: 'Tortilla de papas, pincho moruno, pollo al aglio y rabas',
    precio: 61000,
    precioSuelto: 64900,
  },
  {
    nombre: 'Chamartín',
    incluye: 'Tortilla cherry/camembert, huevos rotos con gambas al ajillo, rabas y cerdo cabrales',
    precio: 68500,
    precioSuelto: 74500,
  },
];

export const RECETA_DEL_MES = 'Gambas al ajillo';

// Metadata de secciones para el panel de admin (activar/desactivar ítems) y
// para filtrar la carta pública por disponibilidad. El "slug" es la clave
// estable que se guarda en MenuItemEstado — no cambiar sin migrar los datos.
export interface SeccionMenu {
  slug: string;
  titulo: string;
  items: { nombre: string }[];
}

export const SECCIONES_MENU: SeccionMenu[] = [
  { slug: 'tortillas', titulo: 'Nuestras Tortillas', items: TORTILLAS },
  { slug: 'tapas_raciones', titulo: 'Tapas y Raciones', items: TAPAS_Y_RACIONES },
  { slug: 'clasicos_mar', titulo: 'Nuestros Clásicos de Mar', items: CLASICOS_DE_MAR },
  { slug: 'arroces', titulo: 'Arroces del Mes', items: ARROCES },
  { slug: 'postres', titulo: 'Postres', items: POSTRES },
  { slug: 'hora_vermut', titulo: 'Hora del Vermut', items: HORA_DEL_VERMUT },
  { slug: 'de_grifo', titulo: 'De Grifo', items: DE_GRIFO },
  { slug: 'vermut_cubatas', titulo: 'Vermut y Cubatas', items: VERMUT_Y_CUBATAS },
  { slug: 'sin_alcohol', titulo: 'Sin Alcohol', items: SIN_ALCOHOL },
  { slug: 'vinitos', titulo: 'Vinitos', items: VINITOS },
  { slug: 'espe_combos', titulo: 'Espe Combos', items: ESPE_COMBOS },
];

export function formatearPrecio(valor: number): string {
  return `$${valor.toLocaleString('es-AR')}`;
}
