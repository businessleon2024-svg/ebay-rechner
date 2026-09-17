import { describe, expect, it } from 'vitest';
import { can, entitlementsFor, FREE_FEATURES, PRO_FEATURES } from './plan';

describe('Tarifstruktur', () => {
  it('schaltet im kostenlosen Tarif keine Pro-Funktion frei', () => {
    const free = entitlementsFor('free');

    expect(Object.values(free).every((value) => value === false)).toBe(true);
  });

  it('schaltet im Pro-Tarif alles frei', () => {
    const pro = entitlementsFor('pro');

    expect(Object.values(pro).every((value) => value === true)).toBe(true);
  });

  it('zeigt Werbung nur im kostenlosen Tarif', () => {
    expect(can('free', 'adFree')).toBe(false);
    expect(can('pro', 'adFree')).toBe(true);
  });

  it('beschreibt beide Tarife für die Vergleichstabelle', () => {
    expect(FREE_FEATURES.length).toBeGreaterThan(0);
    expect(PRO_FEATURES.length).toBeGreaterThan(0);
  });
});
