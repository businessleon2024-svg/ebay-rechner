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
  { id: 'computer', name: 'Computer', standardPercent: 7, reducedPercent: null, confidence: 'official' },
  { id: 'unterhaltungselektronik', name: 'Unterhaltungselektronik', standardPercent: 7, reducedPercent: null, confidence: 'official' },
  { id: 'staubsaugerroboter', name: 'Staubsaugerroboter', standardPercent: 7, reducedPercent: null, confidence: 'official' },
  { id: 'reifen-felgen', name: 'Reifen, Felgen & Kompletträder', standardPercent: 7, reducedPercent: null, confidence: 'official' },
  { id: 'haushaltselektronik-gross', name: 'Haushaltselektronik: Großgeräte', standardPercent: 7, reducedPercent: null, confidence: 'official' },

  // --- 10 % ---
  { id: 'werkzeug-gartengeraete', name: 'Werkzeug & Gartengeräte', standardPercent: 10, reducedPercent: null, confidence: 'official' },
  { id: 'parfum', name: 'Parfüm', standardPercent: 10, reducedPercent: null, confidence: 'official' },

  // --- 13 % ---
  { id: 'haushaltselektronik-klein', name: 'Haushaltselektronik: Kleingeräte', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'computer-elektronik-zubehoer', name: 'Computer- & Elektronik-Zubehör', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'fahrraeder-ebikes', name: 'Fahrräder & E-Bikes', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'koerperpflege-gesundheit', name: 'Körperpflege & Gesundheit', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'auto-motorrad', name: 'Auto & Motorrad', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'baumarkt', name: 'Baumarkt', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'moebel-wohnen', name: 'Möbel & Wohnen', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'lampen-leuchten', name: 'Lampen & Leuchten', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'sport-outdoor', name: 'Sport & Outdoor', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'babyprodukte', name: 'Babyprodukte', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'spielwaren', name: 'Spielwaren', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'lebensmittel', name: 'Lebensmittel', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'sexspielzeug', name: 'Sexspielzeug', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'medien', name: 'Medien', standardPercent: 13, reducedPercent: null, perItemFeeEur: 0.7, confidence: 'official' },

  // --- 14 % ---
  { id: 'garten', name: 'Garten', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'matratzen', name: 'Matratzen', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'kueche-haushalt', name: 'Küche & Haushalt', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'bekleidung', name: 'Bekleidung', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'taschen-accessoires', name: 'Taschen & Accessoires', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'schuhe', name: 'Schuhe', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'tierbedarf', name: 'Tierbedarf', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'camping', name: 'Camping', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'fitness', name: 'Fitness', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'sup', name: 'SUP', standardPercent: 14, reducedPercent: null, confidence: 'official' },

  // --- 16 % ---
  { id: 'schmuck', name: 'Schmuck', standardPercent: 16, reducedPercent: null, confidence: 'official' },

  { id: 'sonstige', name: 'Alle anderen Kategorien', standardPercent: 13, reducedPercent: null, confidence: 'official' },
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
