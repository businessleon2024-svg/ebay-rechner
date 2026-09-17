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

const CATEGORIES: readonly FeeCategory[] = [
  { id: 'computer-elektronik', name: 'Computer, Elektronik, Staubsauger, Reifen', standardPercent: 7, reducedPercent: null, confidence: 'official' },
  { id: 'grossgeraete', name: 'Großgeräte', standardPercent: 7, reducedPercent: null, confidence: 'official' },
  { id: 'werkzeug-garten', name: 'Werkzeug & Gartengeräte', standardPercent: 10, reducedPercent: null, confidence: 'official' },
  { id: 'parfum', name: 'Parfum', standardPercent: 10, reducedPercent: null, confidence: 'official' },
  { id: 'kleingeraete-zubehoer', name: 'Kleingeräte, Elektronikzubehör, Fahrräder', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'koerperpflege-auto', name: 'Körperpflege, Auto & Motorrad', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'baustoffe', name: 'Baustoffe', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'moebel-sport-spielzeug', name: 'Möbel, Sport, Spielzeug, Lebensmittel', standardPercent: 13, reducedPercent: null, confidence: 'official' },
  { id: 'medien', name: 'Medien', standardPercent: 13, reducedPercent: null, perItemFeeEur: 0.7, confidence: 'official' },
  { id: 'garten', name: 'Garten', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'matratzen-kleidung', name: 'Matratzen, Kleidung, Schuhe, Tierbedarf', standardPercent: 14, reducedPercent: null, confidence: 'official' },
  { id: 'schmuck', name: 'Schmuck', standardPercent: 16, reducedPercent: null, confidence: 'official' },
  { id: 'sonstige', name: 'Alle übrigen Kategorien', standardPercent: 13, reducedPercent: null, confidence: 'official' },
];

export const KAUFLAND: Marketplace = {
  id: 'kaufland',
  name: 'Kaufland',
  categories: CATEGORIES,
  defaultCategoryId: 'kleingeraete-zubehoer',
  // Kaufland erhebt keine Gebühr pro Bestellung; die Zahlungsabwicklung ist in
  // der Provision enthalten.
  orderFeeFor: () => 0,
  hasConditionDiscount: false,
  plans: KAUFLAND_PLANS,
  ratesEffectiveFrom: '2026-06-01',
  note: 'Kaufland berechnet keine Gebühr pro Bestellung, dafür eine monatliche Grundgebühr. Der Artikelzustand wirkt sich nicht auf die Provision aus.',
};
