import { normalizeGtin } from '../gtin';

/**
 * Liest Gebührenmeldungen aus E-Mail-Text.
 *
 * Die Meldungen aus dem Rechner tragen seit Beginn einen maschinenlesbaren
 * Block. Bisher las den nur ein Mensch. Diese Datei ist die Gegenseite —
 * damit wird aus einem Postfach voller Nachrichten eine Datengrundlage.
 *
 * Bewusst nachsichtig geschrieben: E-Mail-Programme brechen Zeilen um, setzen
 * Zitatzeichen davor, hängen Signaturen an und wandeln Umlaute. Eine Meldung
 * zu verwerfen, weil ein `>` davorsteht, hieße Daten wegzuwerfen, die jemand
 * sich die Mühe gemacht hat einzutippen.
 *
 * Streng ist die Datei nur dort, wo Nachsicht schaden würde: Ein Satz, der
 * sich nicht als Zahl lesen lässt, wird nicht geraten, sondern verworfen.
 */

const BEGINN = /---\s*GEBUEHRENKOMPASS-MELDUNG\s*v(\d+)\s*---/i;
const ENDE = /---\s*ENDE\s*---/i;

export interface Meldung {
  version: number;
  marktplatz?: string;
  kategorieGewaehlt?: string;
  kategorieAngebot?: string;
  zustand?: string;
  genauigkeit?: string;
  grundlage?: number;
  satzGerechnet?: number;
  satzTatsaechlich?: number;
  provisionGerechnet?: number;
  provisionTatsaechlich?: number;
  gebuehrBruttoGerechnet?: number;
  gebuehrBruttoTatsaechlich?: number;
  produkt?: string;
  ean?: string;
  artikelnummer?: string;
  bestellnummer?: string;
  anmerkung?: string;
}

/** Deutsche wie englische Schreibweise, beides kommt vor. */
function zahl(wert: string): number | undefined {
  const bereinigt = wert.replace(/[%€\s]/g, '').replace(/[^\d.,-]/g, '');
  if (bereinigt === '') return undefined;

  // Das letzte Trennzeichen mit zwei Nachkommastellen ist das Dezimalzeichen.
  const treffer = [...bereinigt.matchAll(/[.,]/g)];
  let normalisiert = bereinigt;
  if (treffer.length > 0) {
    const letzte = treffer[treffer.length - 1];
    const stellenDanach = bereinigt.length - (letzte.index! + 1);
    normalisiert =
      stellenDanach > 0 && stellenDanach <= 2
        ? bereinigt.slice(0, letzte.index!).replace(/[.,]/g, '') +
          '.' +
          bereinigt.slice(letzte.index! + 1)
        : bereinigt.replace(/[.,]/g, '');
  }

  const geparst = Number(normalisiert);
  return Number.isFinite(geparst) ? geparst : undefined;
}

/** Entfernt, was E-Mail-Programme den Zeilen voranstellen. */
function entzitieren(zeile: string): string {
  return zeile.replace(/^[\s>|]+/, '').trim();
}

const SCHLUESSEL: Record<string, keyof Meldung> = {
  marktplatz: 'marktplatz',
  kategorie_gewaehlt: 'kategorieGewaehlt',
  kategorie_angebot: 'kategorieAngebot',
  zustand: 'zustand',
  genauigkeit: 'genauigkeit',
  grundlage: 'grundlage',
  satz_gerechnet: 'satzGerechnet',
  satz_tatsaechlich: 'satzTatsaechlich',
  provision_gerechnet: 'provisionGerechnet',
  provision_tatsaechlich: 'provisionTatsaechlich',
  gebuehr_brutto_gerechnet: 'gebuehrBruttoGerechnet',
  gebuehr_brutto_tatsaechlich: 'gebuehrBruttoTatsaechlich',
  produkt: 'produkt',
  ean: 'ean',
  artikelnummer: 'artikelnummer',
  bestellnummer: 'bestellnummer',
  anmerkung: 'anmerkung',
};

const ZAHLENFELDER = new Set<keyof Meldung>([
  'grundlage',
  'satzGerechnet',
  'satzTatsaechlich',
  'provisionGerechnet',
  'provisionTatsaechlich',
  'gebuehrBruttoGerechnet',
  'gebuehrBruttoTatsaechlich',
]);

/**
 * Setzt ein Feld, dessen Name erst zur Laufzeit feststeht.
 *
 * Die doppelte Umdeutung ist hier bewusst und bleibt auf diese eine Zeile
 * begrenzt: `feld` stammt ausschließlich aus `SCHLUESSEL` und ist damit
 * nachweislich ein Feld von `Meldung`. TypeScript kann das nicht sehen, weil
 * es den Zusammenhang zwischen Name und Werttyp nicht kennt.
 */
function setze(ziel: Meldung, feld: keyof Meldung, wert: string | number): void {
  (ziel as unknown as Record<string, string | number>)[feld] = wert;
}

/**
 * Liest alle Meldungen aus einem Text.
 *
 * Mehrere pro Text sind ausdrücklich erlaubt: Weitergeleitete Sammel-Mails
 * enthalten oft mehrere Blöcke hintereinander.
 */
export function leseMeldungen(text: string): Meldung[] {
  const zeilen = text.split(/\r?\n/);
  const meldungen: Meldung[] = [];
  /*
    Nur `version` steht beim Beginn fest; alle übrigen Felder sind wahlfrei
    und kommen erst beim Lesen dazu.
  */
  let laufend: Meldung | null = null;

  for (const roh of zeilen) {
    const zeile = entzitieren(roh);

    const beginn = zeile.match(BEGINN);
    if (beginn) {
      // Ein zweiter Beginn ohne Ende: Das Angefangene zählt trotzdem.
      if (laufend) meldungen.push(laufend);
      laufend = { version: Number(beginn[1]) };
      continue;
    }

    if (!laufend) continue;

    if (ENDE.test(zeile)) {
      meldungen.push(laufend);
      laufend = null;
      continue;
    }

    const trenner = zeile.indexOf(':');
    if (trenner < 1) continue;

    const name = zeile.slice(0, trenner).trim().toLowerCase();
    const wert = zeile.slice(trenner + 1).trim();
    const feld = SCHLUESSEL[name];
    if (!feld || wert === '') continue;

    if (ZAHLENFELDER.has(feld)) {
      const z = zahl(wert);
      // Nicht raten: Was sich nicht als Zahl lesen lässt, fehlt lieber.
      if (z !== undefined) setze(laufend, feld, z);
    } else if (feld === 'ean') {
      laufend.ean = normalizeGtin(wert);
    } else {
      setze(laufend, feld, wert);
    }
  }

  // Fehlt die Endmarke — abgeschnittene Mail, Signatur dazwischen —, zählt
  // das Gesammelte trotzdem.
  if (laufend) meldungen.push(laufend);

  return meldungen;
}
