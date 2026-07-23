// URL base canónica del sitio. Cuando exista el dominio propio,
// definir NEXT_PUBLIC_SITE_URL en Railway y todo (canonical, OG,
// schema, robots, sitemap) apunta ahí sin tocar código.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://laesperanzadelosascurra.up.railway.app';

export const SITE_NAME = 'La Esperanza de los Ascurra';
