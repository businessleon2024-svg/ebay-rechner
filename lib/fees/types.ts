/**
 * Domänen-Typen des Gebühren- und Margenrechners.
 *
 * Zielgruppe dieser V1: gewerbliche Verkäufer in der Regelbesteuerung
 * (19 % USt auf den Verkauf, eBay-Gebühren netto, da vorsteuerabzugsfähig).
 * Private Verkäufer, Kleinunternehmer und Differenzbesteuerung sind bewusst
 * noch nicht abgebildet – siehe docs/gebuehren-quellen.md.
 */

/** Regelsteuersatz Deutschland. */
export const VAT_RATE = 0.19;

/**
 * Artikelzustand laut eBay-Angebotsformular.
 *
 * Die Unterscheidung ist seit der Gebührenreform zum 01.07.2026 der wichtigste
 * Hebel für Reseller: In den reformierten Kategorien fällt für gebrauchte,
 * generalüberholte und "Neu: Sonstige"-Artikel ein Pauschalsatz von 5 % an
 * statt des regulären Kategoriesatzes von bis zu 14 %.
 */
export type ItemCondition =
  | 'new'
  | 'new_other'
  | 'refurbished_certified'
  | 'refurbished_seller'
  | 'used';

/** Zustände, die für den reduzierten Satz qualifizieren. */
export const REDUCED_RATE_CONDITIONS: readonly ItemCondition[] = [
  'new_other',
  'refurbished_certified',
  'refurbished_seller',
  'used',
];

export function qualifiesForReducedRate(condition: ItemCondition): boolean {
  return REDUCED_RATE_CONDITIONS.includes(condition);
}

/**
 * Wie gut ist ein hinterlegter Gebührensatz belegt?
 *
 * Bewusst explizit: Ein falscher Satz führt hier unmittelbar zu einer falschen
 * Kaufentscheidung. Sätze ohne "official"-Beleg werden in der UI gekennzeichnet.
 */
export type RateConfidence = 'official' | 'press' | 'unverified';

/**
 * Staffelung für Kategorien, die von der Reform zum 01.07.2026 nicht
 * erfasst wurden: bis zur Schwelle der reguläre Satz, darüber ein reduzierter.
 */
export interface RateTier {
  /** Schwellenwert in EUR, bezogen auf den Gesamt-Transaktionsbetrag. */
  thresholdEur: number;
  /** Satz in Prozent für den Anteil oberhalb der Schwelle. */
  abovePercent: number;
}

export interface FeeCategory {
  id: string;
  name: string;
  /** Regulärer Satz in Prozent (Neuware). */
  standardPercent: number;
  /**
   * Reduzierter Satz in Prozent für gebrauchte/generalüberholte Artikel.
   * `null`, wenn die Kategorie nicht an der 5-%-Regelung teilnimmt.
   */
  reducedPercent: number | null;
  /** Staffelung, falls die Kategorie sie noch hat. */
  tier?: RateTier;
  confidence: RateConfidence;
}

/** Ein Kostenposten aus Sicht des Verkäufers. */
export interface CostInput {
  /** Betrag in EUR, brutto (also so, wie er tatsächlich bezahlt wurde). */
  amount: number;
  /**
   * Liegt eine Rechnung mit ausgewiesener USt vor, ist die Vorsteuer also
   * abziehbar? Für typische Reseller-Einkäufe (privat, Flohmarkt, Kleinanzeigen)
   * ist das `false` – ein häufig übersehener Faktor.
   */
  vatDeductible: boolean;
}

export interface FeeCalculationInput {
  categoryId: string;
  condition: ItemCondition;
  /** Artikelpreis in EUR, brutto (was der Käufer für den Artikel zahlt). */
  itemPrice: number;
  /** Versandkosten in EUR, brutto, die der Käufer zahlt. 0 bei Gratisversand. */
  buyerShipping: number;
  /** Eigener Einkaufspreis. */
  purchase: CostInput;
  /** Eigene Versandkosten (Porto). */
  shipping: CostInput;
  /** Sonstige Kosten, z. B. Verpackung. */
  otherCosts?: CostInput;
  /** Werbeanzeigen (Promoted Listings) in Prozent des Verkaufsbetrags. */
  adRatePercent?: number;
  /** Provisionsrabatt in Prozent, z. B. 10 % für Premium-Shop-Inhaber. */
  shopDiscountPercent?: number;
}

export interface FeeBreakdown {
  /** Basis der Verkaufsprovision: Artikelpreis + Käufer-Versand, inkl. USt. */
  grossTransactionAmount: number;
  /** Effektiv angewandter Provisionssatz in Prozent. */
  commissionPercent: number;
  /** Woher der Satz stammt – für die Erklärbarkeit in der UI. */
  commissionBasis: 'reduced_condition' | 'standard' | 'tiered';
  commissionNet: number;
  fixedFeeNet: number;
  adFeeNet: number;
  /** Abgezogener Shop-Rabatt (positiver Betrag). */
  shopDiscountNet: number;
  totalFeeNet: number;
  feeVat: number;
  totalFeeGross: number;
  /**
   * Betrag, den eBay tatsächlich auszahlt: Gesamtbetrag abzüglich der
   * Bruttogebühren. Reine Zahlungsgröße – Umsatzsteuer und eigene Kosten
   * sind darin noch enthalten, der Gewinn liegt entsprechend darunter.
   */
  payout: number;
}

export interface ProfitBreakdown {
  /** Nettoerlös nach Abführung der Umsatzsteuer. */
  revenueNet: number;
  /** An das Finanzamt abzuführende USt aus dem Verkauf. */
  salesVat: number;
  purchaseNet: number;
  /** Vorsteuer, die allein auf den Einkauf entfiel (0 ohne USt-Rechnung). */
  purchaseVatDeducted: number;
  shippingNet: number;
  otherCostsNet: number;
  /** Gesamte abziehbare Vorsteuer aus den Kostenpositionen. */
  inputVatDeducted: number;
  profit: number;
  /** Gewinn in Prozent des Nettoerlöses. */
  marginPercent: number;
  /** Gewinn in Prozent des Einkaufspreises – die Reseller-Kennzahl. */
  roiPercent: number;
}

export interface CalculationResult {
  category: FeeCategory;
  condition: ItemCondition;
  fees: FeeBreakdown;
  profit: ProfitBreakdown;
}
