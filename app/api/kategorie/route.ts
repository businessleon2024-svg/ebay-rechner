import { NextResponse } from 'next/server';
import { kategorienZuGtin, zugang } from '@/lib/ebay-api/client';
import { checkGtin } from '@/lib/gtin';
import { EBAY } from '@/lib/fees/marketplaces';

/**
 * Schlägt zu einer EAN nach, in welche eBay-Kategorien das Produkt
 * tatsächlich eingestellt wird.
 *
 * Die Route ist die einzige Stelle mit Serveranteil. Sie existiert, weil das
 * Zugangsgeheimnis nicht in den Browser darf — und weil sich nur hier
 * zwischenspeichern lässt, was sonst das tägliche Abrufkontingent aufbraucht.
 *
 * Sie beantwortet ausdrücklich nicht die Frage „welcher Satz gilt", sondern
 * „wo steht dieses Produkt". Der Satz folgt daraus erst, wenn die Kategorie
 * einer der hinterlegten entspricht; sonst bleibt es bei einem Hinweis, den
 * der Nutzer selbst einordnet.
 */

/** Ohne Zugangsdaten gibt es nichts abzurufen — dann auch nichts vorzurendern. */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const zugangsdaten = zugang();
  if (!zugangsdaten) {
    return NextResponse.json(
      { fehler: 'nicht_eingerichtet', hinweis: 'Für diese Funktion fehlen die eBay-Zugangsdaten.' },
      { status: 503 },
    );
  }

  const eingabe = new URL(request.url).searchParams.get('ean') ?? '';
  const pruefung = checkGtin(eingabe);
  if (pruefung.status !== 'gueltig') {
    return NextResponse.json({ fehler: 'ungueltige_ean', status: pruefung.status }, { status: 400 });
  }

  try {
    const befund = await kategorienZuGtin(pruefung.normalized, zugangsdaten);

    // Nur wo eine eBay-Kategorie einer hinterlegten entspricht, lässt sich ein
    // Satz nennen. Alles andere bleibt bewusst offen, statt zu raten.
    const kategorien = befund.kategorien.map((eintrag) => {
      const hinterlegt = EBAY.categories.find((kategorie) => kategorie.externalId === eintrag.id);
      return {
        ...eintrag,
        hinterlegteKategorie: hinterlegt ? { id: hinterlegt.id, name: hinterlegt.name } : null,
      };
    });

    return NextResponse.json(
      { ...befund, kategorien },
      {
        headers: {
          // Einen Tag am Netzrand halten: Dieselbe EAN fragt sonst jeder Aufruf
          // erneut ab, und das Kontingent liegt bei rund 1.000 am Tag.
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      },
    );
  } catch (fehler) {
    // Die Ursache gehört ins Serverprotokoll, nicht in die Antwort: Sie kann
    // Teile der Zugangsdaten enthalten.
    console.error('EAN-Abfrage fehlgeschlagen:', fehler);
    return NextResponse.json({ fehler: 'abruf_fehlgeschlagen' }, { status: 502 });
  }
}
