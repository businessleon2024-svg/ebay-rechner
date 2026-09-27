import { requireMarketplace, resolveCategory } from './marketplaces';
import { calculateTieredFee, isTiered, tiersFor } from './tiers';
import {
  VAT_RATE,
  qualifiesForReducedRate,
  type CalculationResult,
  type CostInput,
  type FeeBreakdown,
  type FeeCalculationInput,
  type FeeCategory,
  type Marketplace,
  type ProfitBreakdown,
  type TaxScheme,
} from './types';

export class UnknownCategoryError extends Error {
  constructor(categoryId: string) {
    super(`Unbekannte Kategorie: ${categoryId}`);
    this.name = 'UnknownCategoryError';
  }
}

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Betrag, mit dem ein Kostenposten wirtschaftlich zu Buche schlägt.
 *
 * Die Vorsteuer ist nur abziehbar, wenn sie ausgewiesen *und* der Verkäufer
 * zum Abzug berechtigt ist. Kleinunternehmer sind das nie, und bei der
 * Differenzbesteuerung gilt es nicht für den Einkauf selbst.
 */
const netOf = (cost: CostInput, deductible: boolean): number =>
  deductible && cost.vatDeductible ? cost.amount / (1 + VAT_RATE) : cost.amount;

const EMPTY_COST: CostInput = { amount: 0, vatDeductible: false };

/**
 * Umsatzsteuer auf den Verkauf, je nach Besteuerungsform.
 *
 * Bei der Differenzbesteuerung ist Bemessungsgrundlage allein die Spanne
 * zwischen Verkaufs- und Einkaufspreis; aus ihr wird die Steuer
 * herausgerechnet. Verkauft der Händler unter Einkaufspreis, fällt keine an —
 * eine negative Spanne führt nicht zu einer Erstattung.
 */
function salesVatFor(
  taxScheme: TaxScheme,
  grossTransactionAmount: number,
  purchaseGross: number,
): { salesVat: number; marginTaxBase: number | null } {
  switch (taxScheme) {
    case 'small_business':
      return { salesVat: 0, marginTaxBase: null };
    case 'margin': {
      const marginTaxBase = Math.max(grossTransactionAmount - purchaseGross, 0);
      return {
        salesVat: marginTaxBase * (VAT_RATE / (1 + VAT_RATE)),
        marginTaxBase,
      };
    }
    default:
      return {
        salesVat: grossTransactionAmount * (VAT_RATE / (1 + VAT_RATE)),
        marginTaxBase: null,
      };
  }
}

/**
 * Verkaufsprovision auf den Gesamt-Transaktionsbetrag.
 *
 * Wichtig: Bemessungsgrundlage ist sowohl bei eBay als auch bei Kaufland der
 * Artikelpreis *einschließlich* der vom Käufer gezahlten Versandkosten und der
 * Umsatzsteuer – nicht der Artikelpreis allein.
 */
function commissionFor(
  marketplace: Marketplace,
  category: FeeCategory,
  condition: FeeCalculationInput['condition'],
  grossTransactionAmount: number,
  hasShopSubscription: boolean,
): Pick<
  FeeBreakdown,
  'commissionPercent' | 'commissionBasis' | 'commissionNet' | 'appliedTiers'
> {
  const reducedApplies =
    marketplace.hasConditionDiscount &&
    qualifiesForReducedRate(condition) &&
    category.reducedPercent !== null;

  // Der reduzierte Zustandssatz ist flach und ersetzt jede Staffelung.
  const tiers = reducedApplies
    ? [{ rate: (category.reducedPercent as number) / 100 }]
    : tiersFor(category, hasShopSubscription);

  const commissionNet = calculateTieredFee(grossTransactionAmount, tiers);

  const commissionBasis: FeeBreakdown['commissionBasis'] = reducedApplies
    ? 'reduced_condition'
    : isTiered(grossTransactionAmount, tiers)
      ? 'tiered'
      : 'standard';

  return {
    commissionPercent:
      grossTransactionAmount > 0
        ? (commissionNet / grossTransactionAmount) * 100
        : tiers[0].rate * 100,
    commissionBasis,
    commissionNet,
    appliedTiers: tiers.length > 1 ? tiers : undefined,
  };
}

/**
 * Vollständige Gebühren- und Gewinnrechnung für einen gewerblichen Verkäufer
 * in der Regelbesteuerung.
 */
export function calculate(input: FeeCalculationInput): CalculationResult {
  const marketplace = requireMarketplace(input.marketplaceId);
  const match = resolveCategory(marketplace, {
    externalId: input.externalCategoryId,
    categoryId: input.categoryId,
  });
  if (!match || (input.categoryId && match.precision === 'fallback')) {
    throw new UnknownCategoryError(input.categoryId);
  }
  const { category, precision } = match;

  const grossTransactionAmount = input.itemPrice + input.buyerShipping;

  const { commissionPercent, commissionBasis, commissionNet, appliedTiers } = commissionFor(
    marketplace,
    category,
    input.condition,
    grossTransactionAmount,
    input.hasShopSubscription ?? false,
  );

  const fixedFeeNet =
    marketplace.orderFeeFor(grossTransactionAmount) + (category.perItemFeeEur ?? 0);
  const adFeeNet = grossTransactionAmount * ((input.adRatePercent ?? 0) / 100);
  const shopDiscountNet = commissionNet * ((input.shopDiscountPercent ?? 0) / 100);

  // Eine monatliche Grundgebühr gehört anteilig auf den einzelnen Verkauf,
  // sonst wirkt jeder Verkauf profitabler, als er in Summe ist.
  const monthlyFeeShareNet =
    input.monthlyFee && input.monthlyFee.ordersPerMonth > 0
      ? input.monthlyFee.amountNet / input.monthlyFee.ordersPerMonth
      : 0;

  const listingFeeNet = input.listingFeeNet ?? 0;
  const optionsFeeNet = input.optionsFeeNet ?? 0;
  const internationalFeeNet = input.internationalFeeNet ?? 0;
  const currencyConversionNet = input.currencyConversionNet ?? 0;

  // Der Regelbesteuerer zieht die USt auf die Marktplatzgebühren als Vorsteuer
  // ab, wirtschaftlich relevant ist damit der Nettobetrag.
  const totalFeeNet =
    commissionNet -
    shopDiscountNet +
    fixedFeeNet +
    adFeeNet +
    monthlyFeeShareNet +
    listingFeeNet +
    optionsFeeNet +
    internationalFeeNet +
    currencyConversionNet;
  const feeVat = totalFeeNet * VAT_RATE;

  const fees: FeeBreakdown = {
    itemPrice: round2(input.itemPrice),
    buyerShipping: round2(input.buyerShipping),
    grossTransactionAmount: round2(grossTransactionAmount),
    commissionPercent: Math.round(commissionPercent * 100) / 100,
    commissionBasis,
    appliedTiers,
    commissionNet: round2(commissionNet),
    fixedFeeNet: round2(fixedFeeNet),
    monthlyFeeShareNet: round2(monthlyFeeShareNet),
    adFeeNet: round2(adFeeNet),
    listingFeeNet: round2(listingFeeNet),
    optionsFeeNet: round2(optionsFeeNet),
    internationalFeeNet: round2(internationalFeeNet),
    currencyConversionNet: round2(currencyConversionNet),
    shopDiscountNet: round2(shopDiscountNet),
    totalFeeNet: round2(totalFeeNet),
    feeVat: round2(feeVat),
    totalFeeGross: round2(totalFeeNet + feeVat),
    payout: round2(grossTransactionAmount - (totalFeeNet + feeVat)),
  };

  const otherCosts = input.otherCosts ?? EMPTY_COST;
  const taxScheme = input.taxScheme ?? 'standard';

  // Kleinunternehmer sind gar nicht zum Vorsteuerabzug berechtigt; bei der
  // Differenzbesteuerung gilt er für alles außer den Einkauf selbst.
  const deductsInputVat = taxScheme !== 'small_business';
  const deductsPurchaseVat = deductsInputVat && taxScheme !== 'margin';

  const { salesVat: rawSalesVat, marginTaxBase } = salesVatFor(
    taxScheme,
    grossTransactionAmount,
    input.purchase.amount,
  );

  const salesVat = round2(rawSalesVat);
  const revenueNet = round2(grossTransactionAmount - rawSalesVat);
  const purchaseNet = round2(netOf(input.purchase, deductsPurchaseVat));
  const shippingNet = round2(netOf(input.shipping, deductsInputVat));
  const otherCostsNet = round2(netOf(otherCosts, deductsInputVat));

  // Ohne Vorsteuerabzug trägt der Verkäufer die Gebühren brutto.
  const feeCost = deductsInputVat ? fees.totalFeeNet : fees.totalFeeGross;

  // Aus den gerundeten Positionen ableiten, damit die angezeigte
  // Aufschlüsselung immer exakt aufgeht.
  const profit = round2(revenueNet - purchaseNet - shippingNet - otherCostsNet - feeCost);

  const profitBreakdown: ProfitBreakdown = {
    taxScheme,
    revenueNet,
    salesVat,
    marginTaxBase: marginTaxBase === null ? null : round2(marginTaxBase),
    feeCost,
    purchaseNet,
    purchaseVatDeducted: round2(input.purchase.amount - netOf(input.purchase, deductsPurchaseVat)),
    shippingNet,
    otherCostsNet,
    inputVatDeducted: round2(
      input.purchase.amount -
        netOf(input.purchase, deductsPurchaseVat) +
        (input.shipping.amount - netOf(input.shipping, deductsInputVat)) +
        (otherCosts.amount - netOf(otherCosts, deductsInputVat)),
    ),
    profit,
    marginPercent: revenueNet > 0 ? round2((profit / revenueNet) * 100) : 0,
    roiPercent: purchaseNet > 0 ? round2((profit / purchaseNet) * 100) : 0,
  };

  return {
    marketplace,
    category,
    precision,
    condition: input.condition,
    fees,
    profit: profitBreakdown,
  };
}

/**
 * Höchster Einkaufspreis (brutto), bei dem ein Zielgewinn noch erreicht wird.
 *
 * Das ist die eigentliche Frage beim Wareneinkauf: "Was darf ich maximal
 * zahlen?" Die Gebühren hängen nicht vom Einkaufspreis ab, daher ist das
 * geschlossen lösbar – kein Iterieren nötig.
 */
export function maxPurchasePrice(input: FeeCalculationInput, targetProfit = 0): number {
  const profitAt = (amount: number) =>
    calculate({ ...input, purchase: { ...input.purchase, amount } }).profit.profit;

  // Schon ohne Wareneinsatz nicht erreichbar.
  if (profitAt(0) < targetProfit) return 0;

  let low = 0;
  let high = 1;
  while (profitAt(high) >= targetProfit) {
    high *= 2;
    if (high > 10_000_000) return round2(high);
  }

  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    if (profitAt(mid) >= targetProfit) low = mid;
    else high = mid;
  }

  // Das Runden darf den Zielgewinn nicht kippen: Liegt der gerundete Preis
  // knapp über der Grenze, einen Cent zurück.
  const rounded = round2(low);
  return profitAt(rounded) >= targetProfit ? rounded : round2(rounded - 0.01);
}

/**
 * Verkaufspreis (brutto, ohne Käufer-Versand), ab dem der Verkauf die Kosten
 * deckt. Wegen Staffelung und gestaffelter Fixgebühr ist der Zusammenhang
 * nicht linear – daher numerisch per Bisektion gelöst.
 */
export function breakEvenSellPrice(input: FeeCalculationInput): number {
  const profitAt = (itemPrice: number) => calculate({ ...input, itemPrice }).profit.profit;

  if (profitAt(0) >= 0) return 0;

  let low = 0;
  let high = 1;
  // Obergrenze suchen, bei der der Verkauf profitabel wird.
  while (profitAt(high) < 0) {
    high *= 2;
    if (high > 1_000_000) return Number.POSITIVE_INFINITY;
  }

  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    if (profitAt(mid) < 0) low = mid;
    else high = mid;
  }

  return round2(high);
}
