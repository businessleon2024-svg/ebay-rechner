import { formatCurrency, formatPercent } from '../format';
import { tiersFor } from './tiers';
import type { FeeCategory } from './types';

/**
 * Lesbare Beschreibung des Provisionssatzes einer Kategorie.
 *
 * Wird für die öffentliche Gebührenübersicht gebraucht. Die Angaben stammen
 * aus derselben Konfiguration wie die Berechnung — Tabelle und Rechner können
 * deshalb nicht auseinanderlaufen.
 */
export function describeStandardRate(category: FeeCategory, hasShopSubscription = false): string {
  const tiers = tiersFor(category, hasShopSubscription);

  if (tiers.length === 1) return formatPercent(tiers[0].rate * 100, 0);

  return tiers
    .map((tier, index) =>
      tier.upTo === undefined
        ? `${formatPercent(tier.rate * 100, 0)} darüber`
        : `${formatPercent(tier.rate * 100, 0)} bis ${formatCurrency(tier.upTo)}${index === 0 ? '' : ''}`,
    )
    .join(', ');
}

/** Beschreibung des reduzierten Satzes, oder ein Hinweis auf dessen Fehlen. */
export function describeReducedRate(category: FeeCategory): string {
  return category.reducedPercent === null
    ? '–'
    : formatPercent(category.reducedPercent, 0);
}

/** Zusätzliche Gebühr je Artikel, sofern die Kategorie eine kennt. */
export function describePerItemFee(category: FeeCategory): string | null {
  return category.perItemFeeEur
    ? `zusätzlich ${formatCurrency(category.perItemFeeEur)} je Artikel`
    : null;
}
