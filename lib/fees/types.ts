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
 * Besteuerungsform des Verkäufers. Bestimmt, wie viel Umsatzsteuer auf den
 * Verkauf anfällt und welche Vorsteuer abziehbar ist.
 */
export type TaxScheme =
  /** Regelbesteuerung: 19 % aus dem Bruttoverkaufspreis, Vorsteuer abziehbar. */
  | 'standard'
  /**
   * Differenzbesteuerung nach § 25a UStG. Umsatzsteuer nur auf die Differenz
   * zwischen Verkaufs- und Einkaufspreis. Voraussetzung ist ein Erwerb ohne
   * ausgewiesene Umsatzsteuer, weshalb aus dem Einkauf keine Vorsteuer
   * abziehbar ist — aus Gebühren und übrigen Kosten dagegen schon.
   */
  | 'margin'
  /**
   * Kleinunternehmer nach § 19 UStG. Keine Umsatzsteuer auf den Verkauf,
   * dafür überhaupt kein Vorsteuerabzug: Gebühren und Kosten wirken brutto.
   */
  | 'small_business';

/**
 * Artikelzustand laut eBay-Angebotsformular.
 *
 * Die Unterscheidung ist seit der Gebührenreform zum 01.07.2026 der wichtigste
 * Hebel für Reseller: In den reformierten Kategorien fällt für gebrauchte,
 * generalüberholte und "Neu: Sonstige"-Artikel ein Pauschalsatz von 5 % an
 * statt des regulären Kategoriesatzes. Wie hoch der höchstens ausfällt, steht
 * bewusst nicht hier, sondern ergibt sich aus der Tabelle — `highestRatePercent`
 * in `lib/fees/range.ts`. Eine Zahl an dieser Stelle war schon einmal veraltet.
 */
export type ItemCondition =
  | 'new'
  | 'new_other'
  | 'refurbished_certified'
  | 'refurbished_excellent'
  | 'refurbished_very_good'
  | 'refurbished_good'
  | 'refurbished_seller'
  | 'used'
  | 'used_excellent'
  | 'used_good'
  | 'used_acceptable';

/**
 * Zustände, die für den reduzierten Satz qualifizieren – also alle außer "Neu".
 *
 * Achtung: Das ist nur die halbe Bedingung. Der reduzierte Satz gilt
 * ausschließlich in den Kategorien, die eBay dafür ausdrücklich ausweist
 * (`reducedPercent !== null`), nicht pauschal in jeder Kategorie.
 */
export const REDUCED_RATE_CONDITIONS: readonly ItemCondition[] = [
  'new_other',
  'refurbished_certified',
  'refurbished_excellent',
  'refurbished_very_good',
  'refurbished_good',
  'refurbished_seller',
  'used',
  'used_excellent',
  'used_good',
  'used_acceptable',
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
 * Eine Stufe einer gestaffelten Gebühr.
 *
 * Die Stufen wirken wie ein Steuertarif: Jede gilt nur für den Betragsanteil,
 * der in sie fällt – nicht rückwirkend auf den Gesamtbetrag. Die letzte Stufe
 * lässt `upTo` offen und gilt bis unendlich.
 */
export interface FeeTier {
  /** Obergrenze dieser Stufe in EUR, einschließlich. Offen bei der letzten Stufe. */
  upTo?: number;
  /** Satz als Anteil, also 0.12 für 12 %. */
  rate: number;
}

/**
 * Wie genau der angewandte Satz zum konkreten Angebot passt.
 *
 * Solange nur eine Hauptkategorie bekannt ist, bleibt der Satz eine Schätzung:
 * eBay veröffentlicht nicht für jede Unterkategorie einen eigenen Satz, und
 * einzelne Unterkategorien können abweichen.
 */
export type RatePrecision =
  /** Über die Kategorie-ID des Marktplatzes eindeutig aufgelöst. */
  | 'exact'
  /** Manuell gewählte Hauptkategorie – Unterkategorien können abweichen. */
  | 'main_category'
  /** Auffangkategorie, weil keine passendere gefunden wurde. */
  | 'fallback';

export interface FeeCategory {
  id: string;
  name: string;
  /**
   * Kategorie-ID des Marktplatzes, z. B. eBays numerische ID.
   * Grundlage für die spätere automatische Kategorie-Erkennung.
   */
  externalId?: string;
  /** Überschrift, unter der die Kategorie in der Auswahlliste einsortiert wird. */
  group?: string;
  /** Regulärer Satz in Prozent (Neuware). */
  standardPercent: number;
  /**
   * Reduzierter Satz in Prozent für gebrauchte/generalüberholte Artikel.
   * `null`, wenn die Kategorie keinen reduzierten Satz kennt.
   */
  reducedPercent: number | null;
  /**
   * Staffelung, falls die Kategorie eine hat. Ohne Angabe gilt
   * `standardPercent` auf den gesamten Betrag.
   */
  tiers?: readonly FeeTier[];
  /**
   * Abweichende Staffelung für Verkäufer mit Shop-Abo.
   *
   * Betrifft bisher nur Uhren & Schmuck: Dort sinkt die Schwelle, bis zu der
   * der volle Satz gilt, mit Shop von 990 € auf 500 € — der Shop ist in dieser
   * Kategorie also von Vorteil. Weitere Shop-abhängige Regeln gehören hierher,
   * nicht in die Rechenlogik.
   */
  tiersWithShop?: readonly FeeTier[];
  /** Zusätzlicher Betrag je Artikel, z. B. 0,70 € in Kauflands Medien-Kategorie. */
  perItemFeeEur?: number;
  confidence: RateConfidence;
  /**
   * Kategoriespezifischer Vorbehalt, der in der Oberfläche angezeigt wird –
   * etwa wenn sich Quellen zu einer Schwelle widersprechen.
   */
  caveat?: string;
}

export type MarketplaceId = 'ebay' | 'kaufland';

/** Wählbares Monatspaket eines Marktplatzes. */
export interface MarketplacePlan {
  id: string;
  name: string;
  /** Monatliche Grundgebühr, netto. */
  priceNet: number;
}

export interface Marketplace {
  id: MarketplaceId;
  name: string;
  categories: readonly FeeCategory[];
  /** Vorauswahl im Formular. */
  defaultCategoryId: string;
  /**
   * Gebühr pro Bestellung, abhängig vom Bestellwert.
   * eBay staffelt sie, Kaufland erhebt keine.
   */
  orderFeeFor(grossTransactionAmount: number): number;
  /**
   * Kennt der Marktplatz überhaupt reduzierte Sätze für gebrauchte Ware?
   * Steuert, ob die Zustandsauswahl angeboten wird.
   */
  hasConditionDiscount: boolean;
  /**
   * Zuschlag auf den Transaktionsbetrag bei unterdurchschnittlichem
   * Servicestatus, in Prozent. Fehlt, wenn der Marktplatz keinen erhebt.
   */
  belowStandardSurchargePercent?: number;
  /** Monatliche Grundgebühr, sofern der Marktplatz eine erhebt. */
  plans?: readonly MarketplacePlan[];
  /** Stand der hinterlegten Sätze, ISO-Datum. */
  ratesEffectiveFrom: string;
  /** Kurzer Hinweis zur Gebührenstruktur, wird in der Oberfläche gezeigt. */
  note: string;
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

/**
 * Umlage einer monatlichen Grundgebühr auf den einzelnen Verkauf.
 *
 * Kaufland verlangt eine feste Monatsgebühr statt einer Gebühr pro Bestellung.
 * Ohne Umlage sieht dort jeder einzelne Verkauf profitabler aus, als er ist.
 */
export interface MonthlyFeeInput {
  /** Monatliche Grundgebühr, netto. */
  amountNet: number;
  /** Erwartete Bestellungen pro Monat, auf die sie sich verteilt. */
  ordersPerMonth: number;
}

export interface FeeCalculationInput {
  marketplaceId: MarketplaceId;
  /** Besteuerungsform des Verkäufers. Ohne Angabe Regelbesteuerung. */
  taxScheme?: TaxScheme;
  categoryId: string;
  /**
   * Kategorie-ID des Marktplatzes, falls bekannt – etwa aus einem Angebot
   * ausgelesen. Hat Vorrang vor `categoryId` und führt zu einem exakten Treffer.
   */
  externalCategoryId?: string;
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
  /**
   * Weitere Gebühren, die als fester Betrag anfallen und sich nicht aus dem
   * Verkaufspreis ableiten lassen. Jeweils netto.
   */
  listingFeeNet?: number;
  optionsFeeNet?: number;
  internationalFeeNet?: number;
  currencyConversionNet?: number;
  /**
   * Region des Käufers, aus der sich die internationale Gebühr ergibt —
   * Kennung aus `INTERNATIONAL_REGIONS`.
   *
   * Ein ausdrücklich eingetragener `internationalFeeNet` hat Vorrang. Beide
   * zu addieren wäre die naheliegende, aber falsche Wahl: Wer den Betrag von
   * seiner Abrechnung abtippt *und* die Region stehen lässt, zahlte sonst
   * doppelt. Der abgetippte Betrag ist der belegte, also gewinnt er.
   */
  internationalRegion?: string;
  /** Provisionsrabatt in Prozent, z. B. 10 % für Premium-Shop-Inhaber. */
  shopDiscountPercent?: number;
  /**
   * Besteht ein Shop-Abo? Ändert in einzelnen Kategorien die Staffelgrenze
   * (siehe `FeeCategory.tierWithShop`).
   */
  hasShopSubscription?: boolean;
  /**
   * Servicestatus „Unterdurchschnittlich". eBay erhebt dann zusätzlich zur
   * regulären Provision einen Zuschlag auf denselben Transaktionsbetrag.
   * Auf der Abrechnung steht er als eigene Position „Erhöhte
   * Verkaufsprovision bei Servicestatus Unterdurchschnittlich".
   */
  belowStandardService?: boolean;
  /** Monatliche Grundgebühr, die anteilig auf diesen Verkauf entfällt. */
  monthlyFee?: MonthlyFeeInput;
}

export interface FeeBreakdown {
  /** Artikelpreis brutto, wie eingegeben. */
  itemPrice: number;
  /** Vom Käufer gezahlter Versand, wie eingegeben. */
  buyerShipping: number;
  /** Basis der Verkaufsprovision: Artikelpreis + Käufer-Versand, inkl. USt. */
  grossTransactionAmount: number;
  /** Effektiv angewandter Provisionssatz in Prozent. */
  commissionPercent: number;
  /** Woher der Satz stammt – für die Erklärbarkeit in der UI. */
  commissionBasis: 'reduced_condition' | 'standard' | 'tiered';
  /**
   * Tatsächlich angewandte Staffelung, sofern eine greift. Nötig, damit die
   * Oberfläche die richtige Schwelle nennt — mit Shop kann sie abweichen.
   */
  appliedTiers?: readonly FeeTier[];
  commissionNet: number;
  /**
   * Zuschlag bei unterdurchschnittlichem Servicestatus, 0 wenn keiner anfällt.
   * Bewusst als eigene Position geführt und nicht in die Provision gerechnet:
   * eBay weist ihn getrennt aus, und er ist das Einzige an der Rechnung, was
   * sich durch eigenes Zutun abstellen lässt.
   */
  serviceSurchargeNet: number;
  /** Gebühr pro Bestellung zuzüglich etwaiger Gebühr je Artikel. */
  fixedFeeNet: number;
  /** Anteilige monatliche Grundgebühr, 0 wenn keine umgelegt wird. */
  monthlyFeeShareNet: number;
  adFeeNet: number;
  listingFeeNet: number;
  optionsFeeNet: number;
  internationalFeeNet: number;
  currencyConversionNet: number;
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
  /** Angewandte Besteuerungsform. */
  taxScheme: TaxScheme;
  /** Nettoerlös nach Abführung der Umsatzsteuer. */
  revenueNet: number;
  /** An das Finanzamt abzuführende USt aus dem Verkauf. */
  salesVat: number;
  /**
   * Bemessungsgrundlage der Umsatzsteuer bei Differenzbesteuerung: die
   * Spanne zwischen Verkaufs- und Einkaufspreis. Sonst `null`.
   */
  marginTaxBase: number | null;
  /**
   * Betrag, mit dem die Marktplatzgebühren als Kosten zu Buche schlagen.
   * Netto, solange Vorsteuer abziehbar ist — für Kleinunternehmer brutto.
   */
  feeCost: number;
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
  marketplace: Marketplace;
  category: FeeCategory;
  /** Wie genau der Satz zum konkreten Angebot passt. */
  precision: RatePrecision;
  condition: ItemCondition;
  fees: FeeBreakdown;
  profit: ProfitBreakdown;
}
