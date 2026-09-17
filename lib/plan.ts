/**
 * Tarifstruktur.
 *
 * Bewusst eine reine Datenschicht ohne Server, Login oder Zahlung — die kommen
 * später. Der Zweck ist, dass Free- und Pro-Funktionen von Anfang an an *einer*
 * Stelle definiert sind, statt verstreut in der Oberfläche zu entstehen.
 */

export type Plan = 'free' | 'pro';

export const PRO_PRICE_EUR = 4.99;

export interface Entitlements {
  /** Keine Werbeflächen. */
  adFree: boolean;
  /** Zugriff auf die Chrome Extension. */
  chromeExtension: boolean;
  /** Automatische Produkterkennung auf Händlerseiten. */
  productRecognition: boolean;
  /** Vorgeschlagene eBay-Kategorie statt manueller Auswahl. */
  categorySuggestion: boolean;
  /** Preisvergleich über externe Quellen. */
  priceComparison: boolean;
  /** Verlauf früher berechneter Produkte. */
  productHistory: boolean;
}

const ENTITLEMENTS: Record<Plan, Entitlements> = {
  free: {
    adFree: false,
    chromeExtension: false,
    productRecognition: false,
    categorySuggestion: false,
    priceComparison: false,
    productHistory: false,
  },
  pro: {
    adFree: true,
    chromeExtension: true,
    productRecognition: true,
    categorySuggestion: true,
    priceComparison: true,
    productHistory: true,
  },
};

export function entitlementsFor(plan: Plan): Entitlements {
  return ENTITLEMENTS[plan];
}

export function can(plan: Plan, feature: keyof Entitlements): boolean {
  return ENTITLEMENTS[plan][feature];
}

/**
 * Funktionen des Rechners, die im kostenlosen Tarif enthalten sind.
 *
 * Steht hier explizit, damit die Vergleichstabelle auf der Startseite und die
 * tatsächliche Freischaltung nicht auseinanderlaufen können.
 */
export const FREE_FEATURES = [
  'eBay-Gebühren berechnen',
  'Einkaufs-, Verkaufs- und Versandpreis eingeben',
  'Erwartete Auszahlung',
  'Gewinn und Marge',
  'Maximaler Einkaufspreis und Break-even',
] as const;

export const PRO_FEATURES = [
  'Chrome Extension',
  'Automatische Produkterkennung',
  'Vorgeschlagene eBay-Kategorie',
  'Preisvergleich',
  'Komplett werbefrei',
] as const;
