import { findCategory, requireMarketplace } from './marketplaces';
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
} from './types';

export class UnknownCategoryError extends Error {
  constructor(categoryId: string) {
    super(`Unbekannte Kategorie: ${categoryId}`);
    this.name = 'UnknownCategoryError';
  }
}

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/** Nettobetrag eines Kostenpostens – Vorsteuer nur abziehbar, wenn ausgewiesen. */
const netOf = (cost: CostInput): number =>
  cost.vatDeductible ? cost.amount / (1 + VAT_RATE) : cost.amount;

const EMPTY_COST: CostInput = { amount: 0, vatDeductible: false };

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
): Pick<FeeBreakdown, 'commissionPercent' | 'commissionBasis' | 'commissionNet'> {
  const reducedApplies =
    marketplace.hasConditionDiscount &&
    qualifiesForReducedRate(condition) &&
    category.reducedPercent !== null;

  if (reducedApplies) {
    const percent = category.reducedPercent as number;
    return {
      commissionPercent: percent,
      commissionBasis: 'reduced_condition',
      commissionNet: grossTransactionAmount * (percent / 100),
    };
  }

  const { tier } = category;
  if (tier && grossTransactionAmount > tier.thresholdEur) {
    const commissionNet =
      tier.thresholdEur * (category.standardPercent / 100) +
      (grossTransactionAmount - tier.thresholdEur) * (tier.abovePercent / 100);

    return {
      commissionPercent:
        grossTransactionAmount > 0 ? (commissionNet / grossTransactionAmount) * 100 : 0,
      commissionBasis: 'tiered',
      commissionNet,
    };
  }

  return {
    commissionPercent: category.standardPercent,
    commissionBasis: 'standard',
    commissionNet: grossTransactionAmount * (category.standardPercent / 100),
  };
}

/**
 * Vollständige Gebühren- und Gewinnrechnung für einen gewerblichen Verkäufer
 * in der Regelbesteuerung.
 */
export function calculate(input: FeeCalculationInput): CalculationResult {
  const marketplace = requireMarketplace(input.marketplaceId);
  const category = findCategory(marketplace, input.categoryId);
  if (!category) throw new UnknownCategoryError(input.categoryId);

  const grossTransactionAmount = input.itemPrice + input.buyerShipping;

  const { commissionPercent, commissionBasis, commissionNet } = commissionFor(
    marketplace,
    category,
    input.condition,
    grossTransactionAmount,
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

  // Der Regelbesteuerer zieht die USt auf die Marktplatzgebühren als Vorsteuer
  // ab, wirtschaftlich relevant ist damit der Nettobetrag.
  const totalFeeNet =
    commissionNet - shopDiscountNet + fixedFeeNet + adFeeNet + monthlyFeeShareNet;
  const feeVat = totalFeeNet * VAT_RATE;

  const fees: FeeBreakdown = {
    grossTransactionAmount: round2(grossTransactionAmount),
    commissionPercent: Math.round(commissionPercent * 100) / 100,
    commissionBasis,
    commissionNet: round2(commissionNet),
    fixedFeeNet: round2(fixedFeeNet),
    monthlyFeeShareNet: round2(monthlyFeeShareNet),
    adFeeNet: round2(adFeeNet),
    shopDiscountNet: round2(shopDiscountNet),
    totalFeeNet: round2(totalFeeNet),
    feeVat: round2(feeVat),
    totalFeeGross: round2(totalFeeNet + feeVat),
    payout: round2(grossTransactionAmount - (totalFeeNet + feeVat)),
  };

  const otherCosts = input.otherCosts ?? EMPTY_COST;

  const revenueNet = round2(grossTransactionAmount / (1 + VAT_RATE));
  const purchaseNet = round2(netOf(input.purchase));
  const shippingNet = round2(netOf(input.shipping));
  const otherCostsNet = round2(netOf(otherCosts));

  // Aus den gerundeten Positionen ableiten, damit die angezeigte
  // Aufschlüsselung immer exakt aufgeht.
  const profit = round2(
    revenueNet - purchaseNet - shippingNet - otherCostsNet - fees.totalFeeNet,
  );

  const profitBreakdown: ProfitBreakdown = {
    revenueNet,
    salesVat: round2(grossTransactionAmount - revenueNet),
    purchaseNet,
    purchaseVatDeducted: round2(input.purchase.amount - netOf(input.purchase)),
    shippingNet,
    otherCostsNet,
    inputVatDeducted: round2(
      input.purchase.amount -
        netOf(input.purchase) +
        (input.shipping.amount - netOf(input.shipping)) +
        (otherCosts.amount - netOf(otherCosts)),
    ),
    profit,
    marginPercent: revenueNet > 0 ? round2((profit / revenueNet) * 100) : 0,
    roiPercent: purchaseNet > 0 ? round2((profit / purchaseNet) * 100) : 0,
  };

  return { marketplace, category, condition: input.condition, fees, profit: profitBreakdown };
}

/**
 * Höchster Einkaufspreis (brutto), bei dem ein Zielgewinn noch erreicht wird.
 *
 * Das ist die eigentliche Frage beim Wareneinkauf: "Was darf ich maximal
 * zahlen?" Die Gebühren hängen nicht vom Einkaufspreis ab, daher ist das
 * geschlossen lösbar – kein Iterieren nötig.
 */
export function maxPurchasePrice(input: FeeCalculationInput, targetProfit = 0): number {
  const { profit, purchaseNet } = calculate(input).profit;
  // Spielraum gegenüber dem aktuell angesetzten Einkauf.
  const affordableNet = purchaseNet + profit - targetProfit;
  if (affordableNet <= 0) return 0;

  const gross = input.purchase.vatDeductible
    ? affordableNet * (1 + VAT_RATE)
    : affordableNet;

  return round2(gross);
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
