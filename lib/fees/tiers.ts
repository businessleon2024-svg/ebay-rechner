import type { FeeCategory, FeeTier } from './types';

/**
 * Gestaffelte Gebühr über beliebig viele Stufen.
 *
 * Die Stufen wirken wie ein Steuertarif: Jede gilt nur für den Betragsanteil,
 * der in sie fällt. Ein Betrag von 2.000 € bei [bis 990 → 12 %, darüber 3 %]
 * ergibt 990 × 12 % + 1.010 × 3 % = 149,10 € — nicht 2.000 × 12 %.
 *
 * Bewusst generisch statt als Sonderfall je Kategorie: Neue Staffelregeln
 * gehören in die Gebührenkonfiguration, nicht in die Rechenlogik.
 */
export function calculateTieredFee(amount: number, tiers: readonly FeeTier[]): number {
  if (amount <= 0 || tiers.length === 0) return 0;

  let remaining = amount;
  let lowerBound = 0;
  let total = 0;

  for (const tier of tiers) {
    if (remaining <= 0) break;

    // Letzte Stufe ohne Obergrenze nimmt den gesamten Rest auf.
    const span = tier.upTo === undefined ? remaining : Math.max(tier.upTo - lowerBound, 0);
    const taxable = Math.min(remaining, span);

    total += taxable * tier.rate;
    remaining -= taxable;
    lowerBound = tier.upTo ?? lowerBound;
  }

  return total;
}

/**
 * Die für eine Kategorie geltenden Stufen.
 *
 * Ohne hinterlegte Staffelung ist es eine einzige, nach oben offene Stufe mit
 * dem Standardsatz — damit läuft jede Kategorie durch dieselbe Rechnung.
 */
export function tiersFor(category: FeeCategory, hasShopSubscription: boolean): readonly FeeTier[] {
  if (hasShopSubscription && category.tiersWithShop) return category.tiersWithShop;
  if (category.tiers) return category.tiers;
  return [{ rate: category.standardPercent / 100 }];
}

/** Gilt für diesen Betrag mehr als die erste Stufe? */
export function isTiered(amount: number, tiers: readonly FeeTier[]): boolean {
  const first = tiers[0];
  return tiers.length > 1 && first?.upTo !== undefined && amount > first.upTo;
}
