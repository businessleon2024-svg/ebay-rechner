import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/**
 * Nur die Seiten, die in die Suche gehören. Impressum und
 * Datenschutzerklärung bleiben bewusst draußen — sie tragen nichts zur
 * Auffindbarkeit bei.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE.url, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE.url}/rechner`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE.url}/gebuehren`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
