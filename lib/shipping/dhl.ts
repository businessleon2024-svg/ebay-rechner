/**
 * DHL Paket für Geschäftskunden, Versand innerhalb Deutschlands.
 *
 * ## Woher die Zahlen stammen
 *
 * Aus **345 echten DHL-Rechnungen** von September 2025 bis Oktober 2026,
 * ausgewertet über alle Positionen „DHL PAKET (GK) … kg“. Nicht aus einer
 * Preisliste und nicht aus dem Gedächtnis.
 *
 * Dabei zeigte sich ein Preiswechsel zum Jahreswechsel: Bis Dezember 2025
 * kostete die 1-kg-Stufe 5,05 €, seit Januar 2026 kostet sie 5,00 €; die
 * 10-kg-Stufe fiel von 8,70 € auf 8,65 €. Hinterlegt ist der aktuelle Stand.
 *
 * ## Was hier anders ist als beim Privatkunden
 *
 * **Es zählt nur das Gewicht.** Päckchen S/M und die Unterscheidung nach
 * Kartongröße gibt es im Geschäftskundentarif nicht. Die Maße spielen erst
 * eine Rolle, wenn das Paket die Grenze zur Übergröße reißt — 120 × 60 × 60 cm.
 *
 * ## Grenzen dieser Angaben
 *
 * Es sind **die Preise eines einzelnen Vertrags**. Bei höherer Menge
 * verhandelt DHL andere Staffeln, und andere Anbieter rechnen ohnehin
 * anders. Das ist eine Orientierung, keine Zusage — wer genau rechnen will,
 * trägt seine eigenen Preise ein.
 */

export interface Gewichtsstufe {
  id: string;
  /** Höchstgewicht dieser Stufe in kg, einschließlich. */
  bisKg: number;
  /** Grundpreis in EUR, netto. */
  basispreis: number;
}

/** Zeitraum, aus dem die hinterlegten Preise stammen. */
export const PREISSTAND = 'Januar 2026';

/** Anzahl der ausgewerteten Rechnungen — für die Herkunftsangabe in der UI. */
export const BELEGE = 345;

/**
 * Höchstmaße, bis zu denen der normale Tarif gilt. Darüber berechnet DHL
 * einen Übergrößen-Zuschlag, dessen Höhe in den ausgewerteten Rechnungen
 * nicht vorkommt — deshalb wird er hier nicht beziffert, sondern nur
 * gemeldet.
 */
export const MAX_MASS = { laenge: 120, breite: 60, hoehe: 60 } as const;

/*
  Aufsteigend. `stufeFuer` nimmt die erste passende — das ist dann zugleich
  die günstigste, weil der Preis mit dem Gewicht steigt.
*/
export const GEWICHTSSTUFEN: readonly Gewichtsstufe[] = [
  { id: 'bis-1', bisKg: 1, basispreis: 5.0 },
  { id: 'bis-3', bisKg: 3, basispreis: 5.55 },
  { id: 'bis-5', bisKg: 5, basispreis: 6.6 },
  { id: 'bis-10', bisKg: 10, basispreis: 8.65 },
  { id: 'bis-20', bisKg: 20, basispreis: 13.55 },
  { id: 'bis-31-5', bisKg: 31.5, basispreis: 16.3 },
];

/**
 * Maut- und CO2-Zuschlag je Sendung, in EUR.
 *
 * In 222 Rechnungspositionen ausnahmslos 0,19 € — kein einziger abweichender
 * Wert. Fester Betrag, nicht prozentual.
 */
export const MAUT_ZUSCHLAG = 0.19;

/**
 * Energiezuschlag als Anteil des Grundpreises.
 *
 * Die Rechnungen weisen ihn als „Energiezuschlag DHL Paket (GK) 1,25 %“ aus.
 * Gegengerechnet: 5,00 → 0,06 · 5,55 → 0,07 · 6,60 → 0,08 · 8,65 → 0,11 ·
 * 13,55 → 0,17 · 16,30 → 0,20. Alle sechs Stufen stimmen auf den Cent.
 */
export const ENERGIE_ANTEIL = 0.0125;

export interface Versandkosten {
  stufe: Gewichtsstufe;
  basispreis: number;
  mautZuschlag: number;
  energieZuschlag: number;
  /** Summe aus Grundpreis und beiden Zuschlägen, netto. */
  gesamt: number;
}

function aufCent(betrag: number): number {
  return Math.round(betrag * 100) / 100;
}

/**
 * Gewichtsstufe für ein Gewicht — oder `null` über 31,5 kg.
 *
 * `null` heißt „nicht als Paket versendbar", nicht „kostenlos". Die
 * Oberfläche muss das als eigenen Fall zeigen.
 */
export function stufeFuer(gewichtKg: number): Gewichtsstufe | null {
  if (gewichtKg <= 0) return null;
  return GEWICHTSSTUFEN.find((s) => gewichtKg <= s.bisKg) ?? null;
}

/**
 * Sprengt das Paket die Maße für den normalen Tarif?
 *
 * Die Kanten werden **sortiert** verglichen, nicht der Reihe nach: Ein
 * Karton von 20 × 60 × 110 cm ist derselbe wie 110 × 60 × 20 — man darf ihn
 * drehen. Wer stur Länge gegen Länge prüft, meldet Übergröße, wo keine ist.
 */
export function istUebergross(mass: { laenge: number; breite: number; hoehe: number }): boolean {
  const paket = [mass.laenge, mass.breite, mass.hoehe].sort((a, b) => b - a);
  const grenze = [MAX_MASS.laenge, MAX_MASS.breite, MAX_MASS.hoehe].sort((a, b) => b - a);
  return paket.some((kante, i) => kante > grenze[i]);
}

/**
 * Vollständige Versandkosten für ein Gewicht.
 *
 * `eigenePreise` überschreibt den Grundpreis je Stufe — die Zuschläge
 * rechnen dann auf dem eigenen Preis weiter, denn der Energiezuschlag ist
 * prozentual.
 */
export function versandkosten(
  gewichtKg: number,
  eigenePreise: Readonly<Record<string, number>> = {},
): Versandkosten | null {
  const stufe = stufeFuer(gewichtKg);
  if (!stufe) return null;

  const basispreis = eigenePreise[stufe.id] ?? stufe.basispreis;
  const mautZuschlag = MAUT_ZUSCHLAG;
  const energieZuschlag = aufCent(basispreis * ENERGIE_ANTEIL);

  return {
    stufe,
    basispreis,
    mautZuschlag,
    energieZuschlag,
    gesamt: aufCent(basispreis + mautZuschlag + energieZuschlag),
  };
}

/** Grundpreis einer Stufe unter Berücksichtigung eigener Preise. */
export function basispreisFuer(
  stufe: Gewichtsstufe,
  eigenePreise: Readonly<Record<string, number>> = {},
): number {
  return eigenePreise[stufe.id] ?? stufe.basispreis;
}
