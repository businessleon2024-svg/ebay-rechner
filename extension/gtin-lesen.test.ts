import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isValidGtin } from '../lib/gtin';

/**
 * Die Erweiterung ist klassisches Browser-JavaScript ohne Bündler. Sie kann
 * `lib/gtin.ts` nicht importieren und trägt die Prüfziffer deshalb ein
 * zweites Mal. Das ist die gefährlichste Stelle des ganzen Ordners: Laufen
 * die beiden Fassungen auseinander, nimmt die eine an, was die andere
 * verwirft — und niemand merkt es, weil beide für sich genommen
 * funktionieren.
 *
 * Dieser Test holt die Funktion aus der Quelldatei und hält sie gegen die
 * Fassung der Anwendung.
 */
function pruefzifferAusErweiterung(): (ziffern: string) => boolean {
  const quelle = readFileSync(join(__dirname, 'gtin-lesen.js'), 'utf8');
  const anfang = quelle.indexOf('function pruefzifferStimmt');
  expect(anfang, 'pruefzifferStimmt in gtin-lesen.js nicht gefunden').toBeGreaterThan(-1);

  // Bis zum Ende der Funktion: die erste Zeile, die auf Spaltenanfang mit
  // schließender Klammer endet.
  const ende = quelle.indexOf('\n  }', anfang) + '\n  }'.length;
  const code = quelle.slice(anfang, ende);

  return new Function(`${code}; return pruefzifferStimmt;`)() as (z: string) => boolean;
}

const pruefzifferStimmt = pruefzifferAusErweiterung();

describe('Prüfziffer in der Erweiterung', () => {
  it('nimmt eine echte EAN-13 an', () => {
    expect(pruefzifferStimmt('4006381333931')).toBe(true);
  });

  it('verwirft dieselbe Nummer mit vertauschter letzter Stelle', () => {
    expect(pruefzifferStimmt('4006381333932')).toBe(false);
  });

  it('verwirft Nummern mit unzulässiger Länge', () => {
    expect(pruefzifferStimmt('12345')).toBe(false);
    expect(pruefzifferStimmt('123456789012345')).toBe(false);
  });

  it('verwirft alles, was keine reine Ziffernfolge ist', () => {
    expect(pruefzifferStimmt('400638133393X')).toBe(false);
    expect(pruefzifferStimmt('')).toBe(false);
  });

  /*
    Der eigentliche Zweck dieser Datei: Beide Fassungen müssen zum selben
    Urteil kommen. Geprüft an echten Nummern, an absichtlich verdorbenen und
    an allen Längen, die GS1 kennt.
  */
  it('urteilt wie lib/gtin.ts', () => {
    const nummern = [
      '4006381333931', // EAN-13
      '4006381333932', // dieselbe, Prüfziffer verdorben
      '5025155121191', // EAN-13 aus einem echten Fall
      '036000291452', // UPC-A
      '036000291453',
      '96385074', // EAN-8
      '96385075',
      '00012345600012', // GTIN-14
      '1234567890123',
      '0000000000000',
      '',
      '12345',
      'keine-nummer',
    ];

    for (const nummer of nummern) {
      expect(
        pruefzifferStimmt(nummer),
        `Erweiterung und lib/gtin.ts sind sich bei "${nummer}" uneinig`,
      ).toBe(isValidGtin(nummer));
    }
  });
});
