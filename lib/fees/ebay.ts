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

const CATEGORIES: readonly FeeCategory[] = [
  // --- Geräte: einheitlich 7 %, ausgewiesene Zustände 5 % ---
  { id: 'computer-tablets-netzwerk', externalId: '58058', name: 'Computer, Tablets & Netzwerk', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'drucker', externalId: '1245', name: 'Drucker', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'ersatzteile-pc-videospiele', externalId: '171833', name: 'Ersatzteile & Werkzeuge: PC & Videospiele', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'foto-camcorder', externalId: '625', name: 'Foto & Camcorder', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'speicherkarten-foto', externalId: '18871', name: 'Speicherkarten: Foto & Camcorder', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'objektive', externalId: '3323', name: 'Objektive', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'handys-kommunikation', externalId: '15032', name: 'Handys & Kommunikation', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'speicherkarten-handys', externalId: '96991', name: 'Speicherkarten: Handys & Kommunikation', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'haushaltsgeraete', externalId: '20710', name: 'Haushaltsgeräte', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'konsolen', name: 'Konsolen', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'tv-video-audio', name: 'TV, Video & Audio', standardPercent: 7, reducedPercent: 5, confidence: 'official' },

  // --- Zubehör: einheitlich 12 %, ausgewiesene Zustände 5 % ---
  { id: 'handy-notebook-zubehoer', name: 'Handy- & Notebook-Zubehör', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'drucker-scanner-zubehoer', name: 'Drucker-, Scanner- & PC-Zubehör', standardPercent: 12, reducedPercent: 5, confidence: 'official' },

  // --- Einheitlich 14 %, ausgewiesene Zustände 5 % ---
  { id: 'business-industrie', name: 'Business & Industrie', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'sport', name: 'Sport', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'baby', name: 'Baby', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'moebel-wohnen', name: 'Möbel & Wohnen', standardPercent: 14, reducedPercent: 5, confidence: 'press' },
  { id: 'haustierbedarf', name: 'Haustierbedarf', standardPercent: 14, reducedPercent: 5, confidence: 'press' },
  { id: 'buero-schreibwaren', name: 'Büro & Schreibwaren', standardPercent: 14, reducedPercent: 5, confidence: 'press' },
  { id: 'feinkost', name: 'Feinkost', standardPercent: 14, reducedPercent: null, confidence: 'press' },

  // --- Einheitlich 13 % ---
  { id: 'garten-terrasse', name: 'Garten & Terrasse', standardPercent: 13, reducedPercent: 5, confidence: 'press' },
  { id: 'heimwerker', name: 'Heimwerker', standardPercent: 13, reducedPercent: 5, confidence: 'press' },

  // --- Satz unverändert, Staffelung entfallen ---
  { id: 'musikinstrumente', name: 'Musikinstrumente', standardPercent: 11, reducedPercent: 5, confidence: 'press' },

  // --- Nicht reformiert: Staffelung bleibt, kein reduzierter Satz ---
  { id: 'kleidung-accessoires', name: 'Kleidung & Accessoires', standardPercent: 12, reducedPercent: null, tier: LEGACY_TIER, confidence: 'official' },
  { id: 'auto-motorrad-teile', name: 'Auto & Motorrad: Teile', standardPercent: 12, reducedPercent: null, tier: LEGACY_TIER, confidence: 'official' },
  { id: 'uhren-schmuck', name: 'Uhren & Schmuck', standardPercent: 16, reducedPercent: null, tier: LEGACY_TIER, confidence: 'press' },

  // --- Quellenlage widersprüchlich. Bewusst ohne reduzierten Satz: dass diese
  //     Kategorien an der 5-%-Regel teilnehmen, ist nicht belegt. ---
  { id: 'games', name: 'Games', standardPercent: 12, reducedPercent: null, confidence: 'unverified' },
  { id: 'buecher', name: 'Bücher', standardPercent: 12, reducedPercent: null, confidence: 'unverified' },
  { id: 'filme-serien', name: 'Filme & Serien', standardPercent: 12, reducedPercent: null, confidence: 'unverified' },
  { id: 'musik', name: 'Musik', standardPercent: 12, reducedPercent: null, confidence: 'unverified' },
  { id: 'spielzeug', name: 'Spielzeug', standardPercent: 12, reducedPercent: null, confidence: 'unverified' },
  { id: 'sammeln-seltenes', name: 'Sammeln & Seltenes', standardPercent: 12, reducedPercent: null, confidence: 'unverified' },
  { id: 'beauty-gesundheit', name: 'Beauty & Gesundheit', standardPercent: 12, reducedPercent: null, confidence: 'unverified' },
  { id: 'sonstige', name: 'Sonstige Kategorien', standardPercent: 12, reducedPercent: null, confidence: 'unverified' },
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
