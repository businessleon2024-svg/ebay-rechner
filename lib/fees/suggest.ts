import { EBAY } from './ebay';
import type { FeeCategory } from './types';

/**
 * Kategorievorschläge aus einer Produktbeschreibung.
 *
 * Das Grundproblem: Hinterlegt sind 55 Hauptkategorien, verkauft werden aber
 * Unterkategorien. Wer ein Reinigungsmittel verkauft, findet in der Liste
 * keinen Eintrag „Reinigungsmittel" und rät sich etwas zusammen — oft falsch.
 *
 * Diese Datei schlägt deshalb vor, statt zu schweigen. Sie hält dabei zwei
 * Dinge auseinander, und das ist der ganze Trick:
 *
 *   `belegt`    — an einer echten Abrechnung abgelesen. Hier wissen wir es.
 *   `vermutung` — begründete Einschätzung, sonst nichts.
 *
 * Die Unterscheidung steht in der Oberfläche, nicht nur im Code. Ein
 * geratener Satz, der aussieht wie ein geprüfter, ist schlimmer als gar
 * keiner — genau daran ist die Webcam-Berechnung gescheitert.
 *
 * Übernommen wird ein Vorschlag nie von selbst, immer nur auf Klick.
 */

export type Sicherheit = 'belegt' | 'vermutung';

interface Regel {
  /** Stichwörter, die auf diese Kategorie hindeuten. Kleingeschrieben. */
  woerter: readonly string[];
  categoryId: string;
  sicherheit: Sicherheit;
  /** Warum — wird dem Nutzer angezeigt, damit er selbst urteilen kann. */
  grund: string;
}

/*
  Reihenfolge ist bedeutsam: Spezifische Regeln stehen vor allgemeinen, damit
  „Webcam" nicht an „Computer" hängen bleibt. Belegte Regeln stammen aus den
  Abrechnungen, die dem Rechner schon mehrere Fehler nachgewiesen haben.
*/
const REGELN: readonly Regel[] = [
  // --- Belegt: an echten Gebührenabrechnungen abgelesen ---
  {
    woerter: ['webcam', 'tastatur', 'keyboard', 'maus', 'mouse', 'mousepad', 'mauspad'],
    categoryId: 'tastaturen-maeuse',
    sicherheit: 'belegt',
    grund:
      'Eingabegeräte werden mit 12 % abgerechnet, nicht mit den 7 % der Hauptkategorie Computer — an einer Abrechnung über eine Webcam nachgewiesen.',
  },
  {
    woerter: ['fire tv', 'firetv', 'streaming stick', 'streaming-stick', 'waipu', 'chromecast', 'android tv stick'],
    categoryId: 'streaming-geraete',
    sicherheit: 'belegt',
    grund:
      'Streaming-Sticks erscheinen unter TV, Video & Audio, werden aber mit 12 % abgerechnet statt mit 7 % — an zwei Produktreihen aus Juli 2026 belegt.',
  },
  {
    woerter: ['parfum', 'eau de parfum', 'creme', 'gesichtspflege', 'kosmetik', 'make-up', 'shampoo'],
    categoryId: 'beauty-gesundheit',
    sicherheit: 'belegt',
    grund:
      'Beauty & Gesundheit kostet 12 %, nicht die früher angenommenen 14 % — an drei Abrechnungen aus Juli und August 2026 korrigiert.',
  },
  {
    woerter: ['zahnbürste', 'zahnbuerste', 'mundduschen', 'munddusche'],
    categoryId: 'elektro-mund-zahnpflege',
    sicherheit: 'belegt',
    grund:
      'Elektrische Mund- und Zahnpflege zählt zu den Geräten mit 7 %, nicht zu Beauty & Gesundheit mit 12 %.',
  },
  {
    woerter: ['rasierer', 'scherkopf', 'epilierer', 'haarschneider', 'trimmer'],
    categoryId: 'elektro-enthaarung-rasur',
    sicherheit: 'belegt',
    grund:
      'Geräte und Scherköpfe zur Rasur werden mit 7 % abgerechnet — auch Ersatzscherköpfe, an einer Abrechnung belegt.',
  },
  {
    woerter: ['föhn', 'foehn', 'haartrockner', 'glätteisen', 'glaetteisen', 'lockenstab', 'airstyler'],
    categoryId: 'elektro-haarstyling',
    sicherheit: 'belegt',
    grund: 'Haarstyling-Geräte zählen zu den Geräten mit 7 %.',
  },
  {
    woerter: ['sammelkarte', 'trading card', 'hobby box', 'topps', 'panini', 'booster'],
    categoryId: 'sammeln-seltenes',
    sicherheit: 'belegt',
    grund:
      'Sammeln & Seltenes kostet 11 %, nicht 12 % — an zwei Abrechnungen über Sammelkarten-Boxen korrigiert.',
  },
  {
    woerter: ['staubsauger', 'wasserkocher', 'toaster', 'kaffeemühle', 'kaffeemuehle', 'mixer', 'entsafter', 'küchenmaschine', 'kuechenmaschine', 'fleischwolf', 'nassreiniger', 'saugwischer'],
    categoryId: 'haushaltsgeraete',
    sicherheit: 'belegt',
    grund: 'Haushaltsgeräte werden mit 7 % abgerechnet — an rund 150 Verkäufen bestätigt.',
  },
  {
    woerter: ['akkuschrauber', 'bohrmaschine', 'hochdruckreiniger', 'werkzeug', 'messgerät', 'messgeraet', 'arbeitsleuchte'],
    categoryId: 'heimwerker',
    sicherheit: 'belegt',
    grund: 'Heimwerker-Artikel kosten 13 % — an Bohrschrauber, Hochdruckreiniger und Lasermessgerät belegt.',
  },
  {
    woerter: ['deckenleuchte', 'lampe', 'leuchtmittel', 'led-panel', 'lightstrip', 'messerblock'],
    categoryId: 'moebel-wohnen',
    sicherheit: 'belegt',
    grund: 'Beleuchtung und Küchenausstattung fallen unter Möbel & Wohnen mit 14 % — an mehreren Abrechnungen belegt.',
  },
  {
    woerter: ['hülle', 'huelle', 'case', 'schutzhülle', 'schutzhuelle', 'displayschutz'],
    categoryId: 'handy-zubehoer',
    sicherheit: 'belegt',
    grund:
      'Schutzhüllen zählen zum Zubehör mit 12 %, nicht zum Gerät mit 7 % — an einer Abrechnung über eine Samsung-Hülle vom August 2026 belegt.',
  },
  {
    woerter: ['gaming headset', 'gaming-headset', 'gaming headsets'],
    categoryId: 'zubehoer-pc-videospiele',
    sicherheit: 'belegt',
    grund:
      'Gaming-Headsets kosten 12 %, gewöhnliche Kopfhörer dagegen 7 % — an zwei Abrechnungen aus Juli 2026 belegt. Vor der Reform im Juli lagen auch Gaming-Headsets noch beim Gerätesatz.',
  },
  {
    woerter: ['kopfhörer', 'kopfhoerer', 'ohrhörer', 'ohrhoerer', 'in-ear', 'earbuds', 'lautsprecher', 'soundbar'],
    categoryId: 'tv-video-audio',
    sicherheit: 'belegt',
    grund:
      'Kopfhörer und Lautsprecher zählen zu den Geräten mit 7 % — an mehreren Abrechnungen aus Juli und August 2026 belegt. Achtung: Gaming-Headsets werden mit 12 % abgerechnet.',
  },
  {
    woerter: ['videotürklingel', 'videotuerklingel', 'türklingel', 'tuerklingel', 'überwachungskamera', 'ueberwachungskamera', 'außenkamera', 'aussenkamera', 'innenkamera'],
    categoryId: 'heimwerker',
    sicherheit: 'belegt',
    grund:
      'Sicherheitstechnik wie Videotürklingeln und Überwachungskameras kostet 13 % — an drei Abrechnungen aus Juli und August 2026 belegt, nicht der Gerätesatz von 7 %.',
  },
  {
    woerter: ['laubbläser', 'laubblaeser', 'freischneider', 'rasenmäher', 'rasenmaeher', 'heckenschere', 'vertikutierer'],
    categoryId: 'garten-terrasse',
    sicherheit: 'belegt',
    grund: 'Gartengeräte kosten 13 % — an Akku-Freischneider und Laubbläser belegt.',
  },
  {
    woerter: ['solarmodul', 'solarpanel', 'balkonkraftwerk', 'photovoltaik'],
    categoryId: 'heimwerker',
    sicherheit: 'belegt',
    grund:
      'Solarmodule kosten 13 % — an einer Abrechnung vom Juli 2026 belegt. Garten & Terrasse hat denselben Satz, die Einordnung ändert hier also nichts.',
  },
  {
    woerter: ['controller', 'joy-con', 'joycon', 'gamepad', 'ladestation für controller'],
    categoryId: 'zubehoer-pc-videospiele',
    sicherheit: 'belegt',
    grund: 'Zubehör zu Konsolen kostet 12 %, die Konsole selbst 7 % — an einer Joy-Con-Halterung belegt.',
  },
  {
    woerter: ['spielzeug', 'lego', 'puppenhaus', 'kugelbahn', 'brettspiel'],
    categoryId: 'spielzeug',
    sicherheit: 'belegt',
    grund:
      'Spielzeug ist gestaffelt: 12 % bis 990 €, darüber 3 % — an Abrechnungen über LEGO, Hubelino und ein Puppenhaus belegt.',
  },

  // --- Vermutungen: begründet, aber nicht an einer Abrechnung geprüft ---
  {
    woerter: ['reinigungsmittel', 'putzmittel', 'waschmittel', 'spülmittel', 'spuelmittel', 'reiniger für', 'pflegemittel'],
    categoryId: 'moebel-wohnen',
    sicherheit: 'vermutung',
    grund:
      'Reinigungsmittel sind Verbrauchsgüter und bei eBay üblicherweise Haushaltsbedarf. Zubehör zu einem Gerät kann dagegen beim Gerätesatz von 7 % bleiben — bei Dyson-Ersatzwalzen war das so. Bitte an der Abrechnung prüfen.',
  },
  {
    woerter: ['ersatzteil', 'ersatzwalze', 'filter', 'beutel', 'düse', 'duese'],
    categoryId: 'haushaltsgeraete',
    sicherheit: 'vermutung',
    grund:
      'Zubehör zu Haushaltsgeräten blieb bei einer Abrechnung über Dyson-Ersatzwalzen beim Gerätesatz von 7 % — anders als bei Computer-Zubehör. Ein einzelner Beleg trägt aber keine Regel.',
  },
  {
    woerter: ['kabel', 'adapter', 'netzteil', 'ladegerät', 'ladegeraet', 'hub'],
    categoryId: 'kabel-steckverbinder',
    sicherheit: 'vermutung',
    grund: 'Verbindungszubehör fällt üblicherweise unter Kabel & Steckverbinder mit 12 %.',
  },
  {
    woerter: ['konsole', 'playstation', 'xbox', 'nintendo switch'],
    categoryId: 'konsolen-pc-videospiele',
    sicherheit: 'vermutung',
    grund: 'Konsolen selbst zählen zu den Geräten mit 7 %, Spiele und Zubehör dagegen zu 12 %.',
  },
  {
    woerter: ['smartwatch', 'fitnesstracker', 'fitness tracker'],
    categoryId: 'handys-kommunikation',
    sicherheit: 'vermutung',
    grund:
      'Smartwatches liefen in den Abrechnungen mit dem Gerätesatz, nicht unter Uhren & Schmuck. Klassische Armbanduhren sind ein anderer Fall.',
  },
];

export interface Vorschlag {
  category: FeeCategory;
  sicherheit: Sicherheit;
  grund: string;
  /** Das Stichwort, das die Regel ausgelöst hat — macht den Vorschlag nachvollziehbar. */
  ausloeser: string;
}

/**
 * Sucht passende Kategorien zu einem freien Text.
 *
 * Belegte Treffer stehen vorn: Wo eine Abrechnung vorliegt, soll sie zuerst
 * gesehen werden. Mehrfachtreffer derselben Kategorie werden zusammengefasst.
 */
export function schlageKategorienVor(text: string, grenze = 3): Vorschlag[] {
  const suchtext = text.toLowerCase().trim();
  if (suchtext.length < 3) return [];

  const gefunden = new Map<string, Vorschlag>();

  for (const regel of REGELN) {
    const treffer = regel.woerter.find((wort) => suchtext.includes(wort));
    if (!treffer) continue;
    if (gefunden.has(regel.categoryId)) continue;

    const category = EBAY.categories.find((eintrag) => eintrag.id === regel.categoryId);
    if (!category) continue;

    gefunden.set(regel.categoryId, {
      category,
      sicherheit: regel.sicherheit,
      grund: regel.grund,
      ausloeser: treffer,
    });
  }

  return [...gefunden.values()]
    .sort((a, b) => (a.sicherheit === b.sicherheit ? 0 : a.sicherheit === 'belegt' ? -1 : 1))
    .slice(0, grenze);
}
