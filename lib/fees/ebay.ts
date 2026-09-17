import type { FeeCategory, Marketplace } from './types';

/**
 * eBay Deutschland, gewerbliche Verkäufer.
 *
 * Zum 01.07.2026 hat eBay die Verkaufsprovision umgebaut: In einer Reihe von
 * Kategorien entfällt die Staffelung zugunsten eines einheitlichen Satzes,
 * gleichzeitig sinkt der Satz für gebrauchte und generalüberholte Artikel auf
 * pauschal 5 %.
 *
 * Wichtig: Der reduzierte Satz gilt **nur** in den Kategorien, die eBay dafür
 * ausdrücklich ausweist – erkennbar an `reducedPercent`. Kategorien ohne Beleg
 * tragen bewusst `null`, damit der Rechner die Gebühr im Zweifel eher zu hoch
 * als zu niedrig ansetzt.
 *
 * Herkunft und offene Punkte der einzelnen Sätze: docs/gebuehren-quellen.md
 */

/**
 * Feste Verkaufsgebühr pro Bestellung (seit 12.02.2026).
 *
 * Bis *einschließlich* 10,00 € Bestellwert 0,35 €, erst darüber 0,45 €.
 * Sie fällt pro Bestellung an, nicht pro Artikel – drei Artikel in einer
 * Bestellung kosten also nur einmal die feste Gebühr.
 */
export const FIXED_FEE_UP_TO_THRESHOLD = 0.35;
export const FIXED_FEE_ABOVE_THRESHOLD = 0.45;
export const FIXED_FEE_THRESHOLD_EUR = 10;

/** Pauschalsatz für die von eBay ausgewiesenen Zustände und Kategorien. */
export const REDUCED_CONDITION_PERCENT = 5;

/**
 * Standard-Staffelung der nicht reformierten Kategorien: oberhalb von 990 EUR
 * Transaktionsbetrag fallen nur noch 3 % an.
 */
const LEGACY_TIER = { thresholdEur: 990, abovePercent: 3 } as const;

const GERAETE = 'Geräte';
const ZUBEHOER = 'Zubehör';
const WEITERE = 'Weitere Kategorien';
const UEBRIGE = 'Übrige Kategorien';

const CATEGORIES: readonly FeeCategory[] = [
  // --- Geräte: einheitlich 7 %, ausgewiesene Zustände 5 % ---
  { id: 'computer-tablets-netzwerk', externalId: '58058', group: GERAETE, name: 'Computer, Tablets & Netzwerk', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'drucker', externalId: '1245', group: GERAETE, name: 'Drucker', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'scanner', group: GERAETE, name: 'Scanner', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'foto-camcorder', externalId: '625', group: GERAETE, name: 'Foto & Camcorder', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'objektive', externalId: '3323', group: GERAETE, name: 'Objektive', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'handys-kommunikation', externalId: '15032', group: GERAETE, name: 'Handys & Kommunikation', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'haushaltsgeraete', externalId: '20710', group: GERAETE, name: 'Haushaltsgeräte', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'tv-video-audio', group: GERAETE, name: 'TV, Video & Audio', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'konsolen-pc-videospiele', group: GERAETE, name: 'Konsolen: PC & Videospiele', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'ersatzteile-pc-videospiele', externalId: '171833', group: GERAETE, name: 'Ersatzteile & Werkzeuge: PC & Videospiele', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'speicherkarten-foto', externalId: '18871', group: GERAETE, name: 'Speicherkarten: Foto & Camcorder', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'speicherkarten-handys', externalId: '96991', group: GERAETE, name: 'Speicherkarten: Handys & Kommunikation', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'speicherkarten-pc-videospiele', group: GERAETE, name: 'Speicherkarten: PC & Videospiele', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'elektro-enthaarung-rasur', group: GERAETE, name: 'Elektrische Geräte: Enthaarung & Rasur', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'elektro-mund-zahnpflege', group: GERAETE, name: 'Elektrische Mund- & Zahnpflege', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'elektro-haarstyling', group: GERAETE, name: 'Elektrische Haarstyling-Geräte', standardPercent: 7, reducedPercent: 5, confidence: 'official' },

  // --- Zubehör: einheitlich 12 %, ausgewiesene Zustände 5 % ---
  { id: 'drucker-scanner-zubehoer', group: ZUBEHOER, name: 'Drucker, Scanner & Zubehör', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'handy-zubehoer', group: ZUBEHOER, name: 'Handy-Zubehör', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'notebook-desktop-zubehoer', group: ZUBEHOER, name: 'Notebook- & Desktop-Zubehör', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'tablet-ebook-zubehoer', group: ZUBEHOER, name: 'Tablet- & eBook-Zubehör', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'tastaturen-maeuse', group: ZUBEHOER, name: 'Tastaturen, Mäuse & Pointing', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'kabel-steckverbinder', group: ZUBEHOER, name: 'Kabel & Steckverbinder', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'haushaltsbatterien-strom', group: ZUBEHOER, name: 'Haushaltsbatterien & Strom', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'kameras-drohnen-fotozubehoer', group: ZUBEHOER, name: 'Kameras, Drohnen & Fotozubehör', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'objektive-filter', group: ZUBEHOER, name: 'Objektive & Filter', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'stative-zubehoer', group: ZUBEHOER, name: 'Stative & Zubehör', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'tv-heim-audio-zubehoer', group: ZUBEHOER, name: 'TV- & Heim-Audio-Zubehör', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'zubehoer-tragbare-audio', group: ZUBEHOER, name: 'Zubehör für tragbare Audiogeräte', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'zubehoer-pc-videospiele', group: ZUBEHOER, name: 'Zubehör: PC & Videospiele', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'ersatzteile-tv-video-audio', group: ZUBEHOER, name: 'Ersatzteile & Werkzeuge: TV, Video & Audio', standardPercent: 12, reducedPercent: 5, confidence: 'official' },

  // --- Weitere reformierte Kategorien ---
  { id: 'business-industrie', group: WEITERE, name: 'Business & Industrie', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'buero-schreibwaren', group: WEITERE, name: 'Büro & Schreibwaren', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'sport', group: WEITERE, name: 'Sport', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'baby', group: WEITERE, name: 'Baby', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'moebel-wohnen', group: WEITERE, name: 'Möbel & Wohnen', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'haustierbedarf', group: WEITERE, name: 'Haustierbedarf', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'bastel-kuenstlerbedarf', group: WEITERE, name: 'Bastel- & Künstlerbedarf', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'feinschmecker', group: WEITERE, name: 'Feinschmecker', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'reisen', group: WEITERE, name: 'Reisen', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'verschiedenes', group: WEITERE, name: 'Verschiedenes', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'garten-terrasse', group: WEITERE, name: 'Garten & Terrasse', standardPercent: 13, reducedPercent: 5, confidence: 'official' },
  { id: 'heimwerker', group: WEITERE, name: 'Heimwerker', standardPercent: 13, reducedPercent: 5, confidence: 'official' },
  { id: 'musikinstrumente', group: WEITERE, name: 'Musikinstrumente', standardPercent: 11, reducedPercent: 5, confidence: 'official' },

  // --- Nicht von der Reform erfasst: Staffelung bleibt, kein reduzierter Satz.
  //     Sätze und Schwellen direkt aus eBays Gebührenübersicht. ---
  { id: 'kleidung-accessoires', group: UEBRIGE, name: 'Kleidung & Accessoires', standardPercent: 12, reducedPercent: null, tier: LEGACY_TIER, confidence: 'official' },
  { id: 'auto-motorrad-teile', group: UEBRIGE, name: 'Auto & Motorrad: Teile', standardPercent: 12, reducedPercent: null, tier: LEGACY_TIER, confidence: 'official' },
  { id: 'buecher', group: UEBRIGE, name: 'Bücher & Zeitschriften', standardPercent: 12, reducedPercent: null, tier: LEGACY_TIER, confidence: 'official' },
  { id: 'filme-serien', group: UEBRIGE, name: 'Filme & Serien', standardPercent: 12, reducedPercent: null, tier: LEGACY_TIER, confidence: 'official' },
  { id: 'musik', group: UEBRIGE, name: 'Musik', standardPercent: 12, reducedPercent: null, tier: LEGACY_TIER, confidence: 'official' },
  { id: 'games', group: UEBRIGE, name: 'PC- & Videospiele', standardPercent: 12, reducedPercent: null, tier: LEGACY_TIER, confidence: 'official' },
  { id: 'sammeln-seltenes', group: UEBRIGE, name: 'Sammeln & Seltenes', standardPercent: 12, reducedPercent: null, tier: LEGACY_TIER, confidence: 'official' },
  { id: 'spielzeug', group: UEBRIGE, name: 'Spielzeug', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'beauty-gesundheit', group: UEBRIGE, name: 'Beauty & Gesundheit', standardPercent: 14, reducedPercent: null, confidence: 'official' },

  // Einzige Kategorie, in der ein Shop-Abo die Staffelgrenze verschiebt –
  // und zwar nach unten, also zugunsten des Verkäufers.
  {
    id: 'uhren-schmuck',
    group: UEBRIGE,
    name: 'Uhren & Schmuck',
    standardPercent: 16,
    reducedPercent: null,
    tier: LEGACY_TIER,
    tierWithShop: { thresholdEur: 500, abovePercent: 3 },
    confidence: 'official',
  },
];

export const EBAY: Marketplace = {
  id: 'ebay',
  name: 'eBay',
  categories: CATEGORIES,
  defaultCategoryId: 'handys-kommunikation',
  orderFeeFor: (grossTransactionAmount) =>
    grossTransactionAmount > FIXED_FEE_THRESHOLD_EUR
      ? FIXED_FEE_ABOVE_THRESHOLD
      : FIXED_FEE_UP_TO_THRESHOLD,
  hasConditionDiscount: true,
  ratesEffectiveFrom: '2026-07-01',
  note: 'Gebrauchte und generalüberholte Ware kostet in den dafür ausgewiesenen Kategorien nur 5 %.',
};
