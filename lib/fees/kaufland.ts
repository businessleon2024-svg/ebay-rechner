import type { FeeCategory, Marketplace } from './types';

/**
 * Kaufland Marketplace (kaufland.de).
 *
 * Die Gebührenstruktur unterscheidet sich in drei Punkten grundlegend von eBay:
 * es gibt keine Gebühr pro Bestellung, dafür eine monatliche Grundgebühr, und
 * der Artikelzustand spielt für die Provision keine Rolle.
 *
 * Sätze laut Kauflands eigener Konditionenseite, Markt Deutschland.
 * Siehe docs/gebuehren-quellen.md
 */

export const KAUFLAND_PLANS = [
  { id: 'basic', name: 'Basic', priceNet: 39.95 },
  { id: 'plus', name: 'Plus', priceNet: 59.95 },
] as const;

/**
 * Kategorien einzeln aufgeführt statt zu Gruppen zusammengefasst.
 *
 * Die Zusammenfassung war fehleranfällig: "Küche & Haushalt" (14 %) etwa
 * gehört nicht zu den Haushaltselektronik-Kleingeräten (13 %), und ein
 * Staubsaugerroboter (7 %) wird anders abgerechnet als ein gewöhnlicher
 * Staubsauger (13 %).
 */
const CATEGORIES: readonly FeeCategory[] = [
  // --- 7 % ---
  { id: 'computer', group: '7 %', name: 'Computer', standardPercent: 7, reducedPercent: null, confidence: 'official' },
  { id: 'unterhaltungselektronik', group: '7 %', name: 'Unterhaltungselektronik', standardPercent: 7, reducedPercent: null, confidence: 'official' },
  { id: 'staubsaugerroboter', group: '7 %', name: 'Staubsaugerroboter', standardPercent: 7, reducedPercent: null, confidence: 'official' },
  { id: 'reifen-felgen', group: '7 %', name: 'Reifen, Felgen & Kompletträder', standardPercent: 7, reducedPercent: null, confidence: 'official' },
  { id: 'haushaltselektronik-gross', group: '7 %', name: 'Haushaltselektronik: Großgeräte', standardPercent: 7, reducedPercent: null, confidence: 'official' },

  // --- 10 % ---
  { id: 'werkzeug-gartengeraete', group: '10 %', name: 'Werkzeug & Gartengeräte', standardPercent: 10, reducedPercent: null, confidence: 'official' },
  { id: 'parfum', group: '10 %', name: 'Parfüm', standardPercent: 10, reducedPercent: null, confidence: 'official' },

  // --- 13 % ---
  { id: 'haushaltselektronik-klein', group: '13 %', name: 'Haushaltselektronik: Kleingeräte', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'computer-elektronik-zubehoer', group: '13 %', name: 'Computer- & Elektronik-Zubehör', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'fahrraeder-ebikes', group: '13 %', name: 'Fahrräder & E-Bikes', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'koerperpflege-gesundheit', group: '13 %', name: 'Körperpflege & Gesundheit', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'auto-motorrad', group: '13 %', name: 'Auto & Motorrad', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'baumarkt', group: '13 %', name: 'Baumarkt', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'moebel-wohnen', group: '13 %', name: 'Möbel & Wohnen', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'lampen-leuchten', group: '13 %', name: 'Lampen & Leuchten', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'sport-outdoor', group: '13 %', name: 'Sport & Outdoor', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'babyprodukte', group: '13 %', name: 'Babyprodukte', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'spielwaren', group: '13 %', name: 'Spielwaren', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'lebensmittel', group: '13 %', name: 'Lebensmittel', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'sexspielzeug', group: '13 %', name: 'Sexspielzeug', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'medien', group: '13 %', name: 'Medien', standardPercent: 13, reducedPercent: null, perItemFeeEur: 0.7, confidence: 'official' },

  // --- 14 % ---
  { id: 'garten', group: '14 %', name: 'Garten', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'matratzen', group: '14 %', name: 'Matratzen', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'kueche-haushalt', group: '14 %', name: 'Küche & Haushalt', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'bekleidung', group: '14 %', name: 'Bekleidung', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'taschen-accessoires', group: '14 %', name: 'Taschen & Accessoires', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'schuhe', group: '14 %', name: 'Schuhe', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'tierbedarf', group: '14 %', name: 'Tierbedarf', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'camping', group: '14 %', name: 'Camping', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'fitness', group: '14 %', name: 'Fitness', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'sup', group: '14 %', name: 'SUP', standardPercent: 14, reducedPercent: null, confidence: 'official' },

  // --- 16 % ---
  { id: 'schmuck', group: '16 %', name: 'Schmuck', standardPercent: 16, reducedPercent: null, confidence: 'official' },

  { id: 'sonstige', group: '13 %', name: 'Alle anderen Kategorien', standardPercent: 13, reducedPercent: null, confidence: 'official' },
];

export const KAUFLAND: Marketplace = {
  id: 'kaufland',
  name: 'Kaufland',
  categories: CATEGORIES,
  defaultCategoryId: 'computer-elektronik-zubehoer',
  // Kaufland erhebt keine Gebühr pro Bestellung; die Zahlungsabwicklung ist in
  // der Provision enthalten.
  orderFeeFor: () => 0,
  hasConditionDiscount: false,
  plans: KAUFLAND_PLANS,
  ratesEffectiveFrom: '2026-06-01',
  note: 'Kaufland berechnet keine Gebühr pro Bestellung, dafür eine monatliche Grundgebühr. Der Artikelzustand wirkt sich nicht auf die Provision aus.',
};
