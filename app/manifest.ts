import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/**
 * Web-App-Manifest — macht den Rechner installierbar, auf dem Handy wie auf
 * dem Rechner.
 *
 * Reseller rechnen dort, wo sie einkaufen: im Laden, auf dem Flohmarkt, vor
 * dem Regal. Ein Lesezeichen im Browser ist dafür zu umständlich. Mit diesem
 * Manifest landet der Kompass als eigenes Symbol auf dem Startbildschirm —
 * und am Schreibtisch über „Zum Dock hinzufügen“ im Dock.
 *
 * `start_url` zeigt bewusst auf den Rechner, nicht auf die Startseite: Wer
 * das Symbol antippt, will rechnen, nicht lesen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — Gebühren, Gewinn und Marge`,
    short_name: SITE.name,
    description:
      'Marktplatzgebühren, Auszahlung, Gewinn und Marge für eBay und Kaufland berechnen — auch unterwegs.',
    lang: 'de',
    start_url: '/rechner',
    // Der Rechner ist die ganze Anwendung; alles andere bleibt im Browser.
    scope: '/',
    display: 'standalone',
    /*
      Bewusst keine `orientation`. Hier stand `portrait` — gedacht fürs Handy,
      aber das Manifest gilt auch für die Installation am Schreibtisch, wo ein
      Fenster nun einmal breiter als hoch ist. Auch auf dem Handy ist die
      Sperre unnötig: Wer das Gerät quer hält, um eine lange Zahlenreihe zu
      sehen, soll das dürfen. Das Layout trägt beide Richtungen.
    */
    // Entspricht --bg und --accent aus globals.css.
    background_color: '#f4f6f5',
    theme_color: '#10714e',
    categories: ['business', 'finance', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      /*
        Android beschneidet Symbole je nach Hersteller rund, als Quadrat oder
        als Tropfen. Das maskierbare Symbol hat deshalb mehr Rand, damit die
        Nadel in keiner Form angeschnitten wird.
      */
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Gebührenübersicht',
        short_name: 'Gebühren',
        description: 'Alle Provisionssätze nach Kategorie',
        url: '/gebuehren',
      },
    ],
  };
}
