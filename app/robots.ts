import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// No se bloquean los crawlers de IA (GPTBot, ClaudeBot, PerplexityBot):
// ser leído por los modelos es objetivo del negocio.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
