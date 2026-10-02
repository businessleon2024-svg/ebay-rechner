import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Rechtsseiten gehören nicht in den Index; sie tragen nichts zur Suche
      // bei und verwässern nur das Ergebnis. Die Auswertung ist ein Werkzeug
      // für den Betreiber, kein Angebot an Besucher.
      disallow: ['/impressum', '/datenschutz', '/auswertung'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
