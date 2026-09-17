import { EBAY } from './ebay';
import { KAUFLAND } from './kaufland';
import type { FeeCategory, Marketplace, MarketplaceId } from './types';

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

export { EBAY, KAUFLAND };
