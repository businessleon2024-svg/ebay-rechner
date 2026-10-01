import { NextResponse } from 'next/server';
import { kategorienZuGtin, zugang } from '@/lib/ebay-api/client';
import { checkGtin } from '@/lib/gtin';
import { EBAY } from '@/lib/fees/marketplaces';
import { hinterlegterVorfahr, pfadAlsText } from '@/lib/ebay-api/taxonomy';

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

    /*
      Zuordnung in zwei Schritten, nie über Namensähnlichkeit.

      Zuerst die Blattkategorie selbst — trifft nur, wenn genau sie hinterlegt
      ist. Sonst über den Kategoriepfad die nächsthöhere hinterlegte Ebene.
      Genau das löst den Webcam-Fall: Die Unterkategorie kennt der Rechner
      nicht, die Hauptkategorie darüber schon.

      Mitgeliefert wird außerdem, auf welcher Ebene der Treffer entstand. Eine
      Hauptkategorie ist eine schwächere Auskunft als ein exakter Treffer, und
      das soll die Oberfläche unterscheiden können.
    */
    const bekannteNummern = new Set(
      EBAY.categories
        .map((kategorie) => kategorie.externalId)
        .filter((id): id is string => id !== undefined),
    );

    const kategorien = befund.kategorien.map((eintrag) => {
      const direkt = EBAY.categories.find((kategorie) => kategorie.externalId === eintrag.id);
      const ueberPfad = direkt
        ? undefined
        : hinterlegterVorfahr(eintrag.pfad, bekannteNummern);
      const hinterlegt =
        direkt ?? EBAY.categories.find((kategorie) => kategorie.externalId === ueberPfad);

      return {
        ...eintrag,
        pfadText: pfadAlsText(eintrag.pfad),
        hinterlegteKategorie: hinterlegt ? { id: hinterlegt.id, name: hinterlegt.name } : null,
        treffer: direkt ? 'exakt' : hinterlegt ? 'hauptkategorie' : 'keiner',
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
