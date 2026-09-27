import { EBAY } from './ebay';
import { KAUFLAND } from './kaufland';
import type { FeeCategory, Marketplace, MarketplaceId, RatePrecision } from './types';

export const MARKETPLACES: readonly Marketplace[] = [EBAY, KAUFLAND];

const BY_ID = new Map(MARKETPLACES.map((marketplace) => [marketplace.id, marketplace]));

export class UnknownMarketplaceError extends Error {
  constructor(marketplaceId: string) {
    super(`Unbekannter Marktplatz: ${marketplaceId}`);
    this.name = 'UnknownMarketplaceError';
  }
}

export function findMarketplace(id: MarketplaceId): Marketplace | undefined {
  return BY_ID.get(id);
}

export function requireMarketplace(id: MarketplaceId): Marketplace {
  const marketplace = BY_ID.get(id);
  if (!marketplace) throw new UnknownMarketplaceError(id);
  return marketplace;
}

export function findCategory(
  marketplace: Marketplace,
  categoryId: string,
): FeeCategory | undefined {
  return marketplace.categories.find((category) => category.id === categoryId);
}

export interface CategoryQuery {
  /** Kategorie-ID des Marktplatzes, etwa aus einem eBay-Angebot ausgelesen. */
  externalId?: string;
  /** Im Formular gewählte Kategorie. */
  categoryId?: string;
}

export interface CategoryMatch {
  category: FeeCategory;
  precision: RatePrecision;
}

/**
 * Kategorie auflösen – in dieser Reihenfolge:
 *
 * 1. exakte Kategorie-ID des Marktplatzes
 * 2. ausdrücklich gewählte Kategorie
 * 3. Auffangkategorie des Marktplatzes
 *
 * Bewusst **kein** Raten über den Kategorienamen: "enthält Elektronik, also
 * 7 %" wäre zu fehleranfällig, weil Unterkategorien mit ähnlichem Namen
 * unterschiedlich abgerechnet werden.
 */
export function resolveCategory(
  marketplace: Marketplace,
  query: CategoryQuery,
): CategoryMatch | undefined {
  if (query.externalId) {
    const byExternalId = marketplace.categories.find(
      (category) => category.externalId === query.externalId,
    );
    if (byExternalId) return { category: byExternalId, precision: 'exact' };
  }

  if (query.categoryId) {
    const chosen = findCategory(marketplace, query.categoryId);
    // Auch eine ausdrücklich gewählte Kategorie bleibt eine Hauptkategorie:
    // Unterkategorien können abweichen, eBay weist sie nicht vollständig aus.
    if (chosen) return { category: chosen, precision: 'main_category' };
  }

  const fallback = findCategory(marketplace, marketplace.defaultCategoryId);
  return fallback ? { category: fallback, precision: 'fallback' } : undefined;
}

export { EBAY, KAUFLAND };
