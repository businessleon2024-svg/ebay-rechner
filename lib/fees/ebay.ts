import type { FeeCategory, Marketplace } from './types';

/**
 * eBay Deutschland, gewerbliche Verkäufer.
 *
 * Zum 01.07.2026 hat eBay die Verkaufsprovision umgebaut: In rund 43 von 80
 * Kategorien entfällt die Staffelung zugunsten eines einheitlichen Satzes,
 * gleichzeitig sinkt der Satz für gebrauchte und generalüberholte Artikel auf
 * pauschal 5 %.
 *
 * Herkunft und offene Punkte der einzelnen Sätze: docs/gebuehren-quellen.md
 */

/** Fixgebühr pro Bestellung, gestaffelt nach Bestellwert (seit 12.02.2026). */
export const FIXED_FEE_BELOW_THRESHOLD = 0.35;
export const FIXED_FEE_AT_OR_ABOVE_THRESHOLD = 0.45;
export const FIXED_FEE_THRESHOLD_EUR = 10;

/**
 * Pauschalsatz für gebrauchte / generalüberholte / "Neu: Sonstige" Artikel in
 * den reformierten Kategorien.
 */
export const REDUCED_CONDITION_PERCENT = 5;

/**
 * Standard-Staffelung der nicht reformierten Kategorien: oberhalb von 990 EUR
 * Transaktionsbetrag fallen nur noch 3 % an.
 */
const LEGACY_TIER = { thresholdEur: 990, abovePercent: 3 } as const;

const CATEGORIES: readonly FeeCategory[] = [
  // --- Geräte: reformiert auf 7 %, gebraucht 5 % (offizielle Gebührenseite) ---
  { id: 'computer-tablets-netzwerk', name: 'Computer, Tablets & Netzwerk', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'handys-kommunikation', name: 'Handys & Kommunikation', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'foto-camcorder', name: 'Foto & Camcorder', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'tv-video-audio', name: 'TV, Video & Audio', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'drucker', name: 'Drucker', standardPercent: 7, reducedPercent: 5, confidence: 'official' },
  { id: 'haushaltsgeraete', name: 'Haushaltsgeräte', standardPercent: 7, reducedPercent: 5, confidence: 'press' },
  { id: 'konsolen', name: 'Konsolen', standardPercent: 7, reducedPercent: 5, confidence: 'press' },

  // --- Zubehör: reformiert auf 12 %, gebraucht 5 % ---
  { id: 'handy-notebook-zubehoer', name: 'Handy- & Notebook-Zubehör', standardPercent: 12, reducedPercent: 5, confidence: 'official' },
  { id: 'drucker-scanner-zubehoer', name: 'Drucker-, Scanner- & PC-Zubehör', standardPercent: 12, reducedPercent: 5, confidence: 'official' },

  // --- Reformiert auf 14 %, gebraucht 5 % ---
  { id: 'business-industrie', name: 'Business & Industrie', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'sport', name: 'Sport', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'baby', name: 'Baby', standardPercent: 14, reducedPercent: 5, confidence: 'official' },
  { id: 'moebel-wohnen', name: 'Möbel & Wohnen', standardPercent: 14, reducedPercent: 5, confidence: 'press' },
  { id: 'haustierbedarf', name: 'Haustierbedarf', standardPercent: 14, reducedPercent: 5, confidence: 'press' },
  { id: 'buero-schreibwaren', name: 'Büro & Schreibwaren', standardPercent: 14, reducedPercent: 5, confidence: 'press' },
  { id: 'feinkost', name: 'Feinkost', standardPercent: 14, reducedPercent: null, confidence: 'press' },

  // --- Reformiert auf 13 % ---
  { id: 'garten-terrasse', name: 'Garten & Terrasse', standardPercent: 13, reducedPercent: 5, confidence: 'press' },
  { id: 'heimwerker', name: 'Heimwerker', standardPercent: 13, reducedPercent: 5, confidence: 'press' },

  // --- Reformiert, Satz unverändert ---
  { id: 'musikinstrumente', name: 'Musikinstrumente', standardPercent: 11, reducedPercent: 5, confidence: 'press' },

  // --- Nicht reformiert: Staffelung bleibt bestehen ---
  { id: 'kleidung-accessoires', name: 'Kleidung & Accessoires', standardPercent: 12, reducedPercent: null, tier: LEGACY_TIER, confidence: 'official' },
  { id: 'auto-motorrad-teile', name: 'Auto & Motorrad: Teile', standardPercent: 12, reducedPercent: null, tier: LEGACY_TIER, confidence: 'official' },
  { id: 'uhren-schmuck', name: 'Uhren & Schmuck', standardPercent: 16, reducedPercent: null, tier: LEGACY_TIER, confidence: 'press' },

  // --- Quellenlage widersprüchlich, in der UI als ungeprüft gekennzeichnet ---
  { id: 'games', name: 'Games', standardPercent: 12, reducedPercent: 5, confidence: 'unverified' },
  { id: 'buecher', name: 'Bücher', standardPercent: 12, reducedPercent: null, confidence: 'unverified' },
  { id: 'filme-serien', name: 'Filme & Serien', standardPercent: 12, reducedPercent: null, confidence: 'unverified' },
  { id: 'musik', name: 'Musik', standardPercent: 12, reducedPercent: null, confidence: 'unverified' },
  { id: 'spielzeug', name: 'Spielzeug', standardPercent: 12, reducedPercent: 5, confidence: 'unverified' },
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
    grossTransactionAmount >= FIXED_FEE_THRESHOLD_EUR
      ? FIXED_FEE_AT_OR_ABOVE_THRESHOLD
      : FIXED_FEE_BELOW_THRESHOLD,
  hasConditionDiscount: true,
  ratesEffectiveFrom: '2026-07-01',
  note: 'Gebrauchte und generalüberholte Ware kostet in vielen Kategorien nur 5 % statt bis zu 14 %.',
};
