/**
 * Internationale Gebühr bei eBay — Zuschlag, wenn der Käufer außerhalb des
 * eigenen Markts registriert ist.
 *
 * Der Rechner konnte diesen Zuschlag schon immer berücksichtigen, aber nur
 * als Eurobetrag zum Eintippen. Das setzt voraus, dass man den Satz kennt und
 * selbst multipliziert — also genau die Rechnung von Hand macht, die einem
 * der Rechner abnehmen soll.
 *
 * ## Belegstand
 *
 * Diese Sätze sind **nicht** an echten Abrechnungen geprüft. In den 497
 * ausgewerteten Bestellungen aus Februar bis August 2026 kommt kein einziger
 * internationaler Verkauf vor — es gab schlicht nichts zu vergleichen.
 *
 * Sie stammen aus dem Marktplatz-Rechner und decken sich mit dem, was eBay
 * öffentlich nennt. Das ist ein Hinweis, kein Beleg: Beide könnten derselben
 * veralteten Quelle folgen. Deshalb tragen sie `unverified` und die
 * Oberfläche weist darauf hin, statt die Zahl für bare Münze auszugeben.
 *
 * Eine einzige Abrechnung mit einem Verkauf nach UK würde das klären.
 */
export interface InternationalRegion {
  id: string;
  /** Kurzname für die Schaltfläche. */
  name: string;
  /** Ausgeschrieben, für die Vorlesehilfe und den Titel. */
  beschreibung: string;
  percent: number;
}

export const INTERNATIONAL_REGIONS: readonly InternationalRegion[] = [
  {
    id: 'inland',
    name: 'DE/EU',
    beschreibung: 'Käufer in Deutschland oder der EU — kein Zuschlag',
    percent: 0,
  },
  { id: 'uk', name: 'UK', beschreibung: 'Käufer im Vereinigten Königreich', percent: 1.2 },
  { id: 'us_ca', name: 'USA/CA', beschreibung: 'Käufer in den USA oder Kanada', percent: 1.6 },
  { id: 'welt', name: 'Übrige', beschreibung: 'Käufer im übrigen Ausland', percent: 3.3 },
];

export const DEFAULT_INTERNATIONAL_REGION = 'inland';

export function findInternationalRegion(id: string): InternationalRegion | undefined {
  return INTERNATIONAL_REGIONS.find((region) => region.id === id);
}

/**
 * Satz zu einer Region. Unbekannte Kennung ergibt 0 — ein gespeicherter Wert
 * aus einer älteren Fassung soll keinen Zuschlag erfinden, den niemand
 * ausgewählt hat.
 */
export function internationalRatePercent(id: string | undefined): number {
  if (!id) return 0;
  return findInternationalRegion(id)?.percent ?? 0;
}
