'use client';

import { useEffect, useMemo, useState } from 'react';
import { breakEvenSellPrice, calculate, maxPurchasePrice } from '@/lib/fees/calculate';
import { MARKETPLACES, requireMarketplace } from '@/lib/fees/marketplaces';
import type { FeeCalculationInput, FeeCategory, ItemCondition, MarketplaceId } from '@/lib/fees/types';
import { parseNumber } from '@/lib/format';
import { ResultPanel } from './result-panel';

const STORAGE_KEY = 'ebayCalc.v3';

/** Artikelzustände wie im eBay-Angebotsformular. */
const CONDITIONS: ReadonlyArray<{ value: ItemCondition; label: string }> = [
  { value: 'new', label: 'Neu' },
  { value: 'new_other', label: 'Neu: Sonstige' },
  { value: 'refurbished_certified', label: 'Zertifiziert – Refurbished' },
  { value: 'refurbished_excellent', label: 'Hervorragend – Refurbished' },
  { value: 'refurbished_very_good', label: 'Sehr gut – Refurbished' },
  { value: 'refurbished_good', label: 'Gut – Refurbished' },
  { value: 'refurbished_seller', label: 'Vom Verkäufer generalüberholt' },
  { value: 'used', label: 'Gebraucht' },
  { value: 'used_excellent', label: 'Gebraucht – Hervorragend' },
  { value: 'used_good', label: 'Gebraucht – Gut' },
  { value: 'used_acceptable', label: 'Gebraucht – Akzeptabel' },
];

interface FormState {
  marketplaceId: MarketplaceId;
  categoryId: string;
  condition: ItemCondition;
  itemPrice: string;
  buyerShipping: string;
  purchase: string;
  purchaseVatDeductible: boolean;
  shipping: string;
  shippingVatDeductible: boolean;
  otherCosts: string;
  otherCostsVatDeductible: boolean;
  adRatePercent: string;
  shopDiscountPercent: string;
  targetProfit: string;
  monthlyPlanId: string;
  ordersPerMonth: string;
}

const INITIAL_STATE: FormState = {
  marketplaceId: 'ebay',
  categoryId: 'handys-kommunikation',
  condition: 'used',
  itemPrice: '',
  buyerShipping: '',
  purchase: '',
  purchaseVatDeductible: false,
  shipping: '',
  shippingVatDeductible: true,
  otherCosts: '',
  otherCostsVatDeductible: true,
  adRatePercent: '',
  shopDiscountPercent: '',
  targetProfit: '',
  monthlyPlanId: 'basic',
  ordersPerMonth: '',
};

function toCalculationInput(form: FormState): FeeCalculationInput {
  const marketplace = requireMarketplace(form.marketplaceId);
  const plan = marketplace.plans?.find((candidate) => candidate.id === form.monthlyPlanId);
  const ordersPerMonth = parseNumber(form.ordersPerMonth);

  return {
    marketplaceId: form.marketplaceId,
    categoryId: form.categoryId,
    condition: form.condition,
    itemPrice: parseNumber(form.itemPrice),
    buyerShipping: parseNumber(form.buyerShipping),
    purchase: {
      amount: parseNumber(form.purchase),
      vatDeductible: form.purchaseVatDeductible,
    },
    shipping: {
      amount: parseNumber(form.shipping),
      vatDeductible: form.shippingVatDeductible,
    },
    otherCosts: {
      amount: parseNumber(form.otherCosts),
      vatDeductible: form.otherCostsVatDeductible,
    },
    adRatePercent: parseNumber(form.adRatePercent),
    shopDiscountPercent: parseNumber(form.shopDiscountPercent),
    monthlyFee:
      plan && ordersPerMonth > 0
        ? { amountNet: plan.priceNet, ordersPerMonth }
        : undefined,
  };
}

/**
 * Zuletzt eingegebene Werte wiederherstellen.
 *
 * Läuft ausschließlich im Browser: die Komponente wird bewusst ohne SSR
 * eingebunden (siehe calculator-island.tsx), damit hier direkt aus dem
 * localStorage initialisiert werden kann, ohne Hydration-Mismatch.
 */
function restoreState(): FormState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const restored = { ...INITIAL_STATE, ...(JSON.parse(raw) as Partial<FormState>) };

    // Eine gespeicherte Kategorie kann zu einem anderen Marktplatz gehören.
    const marketplace = requireMarketplace(restored.marketplaceId);
    const known = marketplace.categories.some((c) => c.id === restored.categoryId);
    return known ? restored : { ...restored, categoryId: marketplace.defaultCategoryId };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return INITIAL_STATE;
  }
}

export function Calculator() {
  const [form, setForm] = useState<FormState>(restoreState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const marketplace = requireMarketplace(form.marketplaceId);
  const selectedCategory = marketplace.categories.find((c) => c.id === form.categoryId);

  // Bei rund 45 Kategorien je Marktplatz ist eine flache Liste nicht mehr
  // überschaubar. Reihenfolge der Gruppen folgt dem ersten Auftreten.
  const groupedCategories = useMemo(() => {
    const groups = new Map<string, FeeCategory[]>();
    for (const category of marketplace.categories) {
      const key = category.group ?? 'Kategorien';
      const existing = groups.get(key);
      if (existing) existing.push(category);
      else groups.set(key, [category]);
    }
    return [...groups.entries()];
  }, [marketplace]);

  // Kategorien sind je Marktplatz verschieden – beim Wechsel auf die
  // Standardkategorie zurückfallen, statt eine unbekannte ID zu behalten.
  const selectMarketplace = (id: MarketplaceId) =>
    setForm((current) => ({
      ...current,
      marketplaceId: id,
      categoryId: requireMarketplace(id).defaultCategoryId,
    }));

  const calculation = useMemo(() => {
    const input = toCalculationInput(form);
    return {
      result: calculate(input),
      maxPurchase: maxPurchasePrice(input, parseNumber(form.targetProfit)),
      breakEven: breakEvenSellPrice(input),
    };
  }, [form]);

  const reset = () => {
    setForm({ ...INITIAL_STATE, marketplaceId: form.marketplaceId, categoryId: marketplace.defaultCategoryId });
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const moneyField = (
    id: keyof FormState & string,
    label: string,
    options: { suffix?: string; step?: string; hint?: string; placeholder?: string } = {},
  ) => (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          className="input"
          type="number"
          inputMode="decimal"
          min="0"
          step={options.step ?? '0.01'}
          placeholder={options.placeholder ?? '0,00'}
          autoComplete="off"
          value={form[id] as string}
          onChange={(event) => update(id, event.target.value as FormState[typeof id])}
        />
        <span className="input-suffix">{options.suffix ?? '€'}</span>
      </div>
      {options.hint && <p className="hint">{options.hint}</p>}
    </>
  );

  const vatToggle = (
    key: 'purchaseVatDeductible' | 'shippingVatDeductible' | 'otherCostsVatDeductible',
  ) => (
    <label className="checkline">
      <input
        type="checkbox"
        checked={form[key]}
        onChange={(event) => update(key, event.target.checked)}
      />
      Rechnung mit ausgewiesener USt
    </label>
  );

  return (
    <div className="calc-shell">
      <div className="tabs" role="tablist" aria-label="Marktplatz">
        {MARKETPLACES.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={option.id === form.marketplaceId}
            className={`tab${option.id === form.marketplaceId ? ' is-active' : ''}`}
            onClick={() => selectMarketplace(option.id)}
          >
            {option.name}
          </button>
        ))}
      </div>

      <main className="layout">
        <section className="panel form-panel" aria-labelledby="formHeading">
          <h2 id="formHeading" className="panel__heading">
            Angaben zum Verkauf
          </h2>

          <div className="field">
            <label htmlFor="categorySelect">Kategorie</label>
            <div className="input-wrap">
              <select
                id="categorySelect"
                className="input"
                value={form.categoryId}
                onChange={(event) => update('categoryId', event.target.value)}
              >
                {groupedCategories.map(([group, categories]) => (
                  <optgroup key={group} label={group}>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} · {category.standardPercent} %
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {marketplace.hasConditionDiscount ? (
            <div className="field">
              <label htmlFor="conditionSelect">Artikelzustand</label>
              <div className="input-wrap">
                <select
                  id="conditionSelect"
                  className="input"
                  value={form.condition}
                  onChange={(event) => update('condition', event.target.value as ItemCondition)}
                >
                  {CONDITIONS.map((condition) => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="hint">
                {selectedCategory?.reducedPercent !== null && selectedCategory !== undefined
                  ? `In dieser Kategorie kosten gebrauchte und generalüberholte Artikel ${selectedCategory.reducedPercent} % statt ${selectedCategory.standardPercent} %.`
                  : 'Diese Kategorie kennt keinen reduzierten Satz – der Zustand ändert die Provision hier nicht.'}
              </p>
            </div>
          ) : (
            <p className="hint hint--standalone">{marketplace.note}</p>
          )}

          <div className="field">{moneyField('itemPrice', 'Verkaufspreis (Brutto)')}</div>

          <div className="field">
            {moneyField('buyerShipping', 'Versand, den der Käufer zahlt', {
              hint: 'Zählt zur Bemessungsgrundlage der Provision. Bei Gratisversand 0 eintragen.',
            })}
          </div>

          <div className="field">
            {moneyField('purchase', 'Einkaufspreis')}
            {vatToggle('purchaseVatDeductible')}
          </div>

          <div className="field">
            {moneyField('shipping', 'Eigene Versandkosten')}
            {vatToggle('shippingVatDeductible')}
          </div>

          {marketplace.plans && (
            <div className="field">
              <span className="field__label">Monatliche Grundgebühr</span>
              <div className="field-row">
                <div className="input-wrap">
                  <select
                    className="input"
                    aria-label="Paket"
                    value={form.monthlyPlanId}
                    onChange={(event) => update('monthlyPlanId', event.target.value)}
                  >
                    {marketplace.plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} · {plan.priceNet.toFixed(2).replace('.', ',')} €
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="input-wrap">
                    <input
                      id="ordersPerMonth"
                      className="input"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      placeholder="Verkäufe"
                      autoComplete="off"
                      aria-label="Verkäufe pro Monat"
                      value={form.ordersPerMonth}
                      onChange={(event) => update('ordersPerMonth', event.target.value)}
                    />
                    <span className="input-suffix">/ Mon.</span>
                  </div>
                </div>
              </div>
              <p className="hint">
                Wird anteilig auf den einzelnen Verkauf umgelegt. Ohne Angabe der Verkäufe pro
                Monat bleibt sie unberücksichtigt.
              </p>
            </div>
          )}

          <details className="advanced">
            <summary>Weitere Kosten &amp; Zielgewinn</summary>
            <div className="advanced__body">
              <div className="field">
                {moneyField('otherCosts', 'Sonstige Kosten (Verpackung o. Ä.)')}
                {vatToggle('otherCostsVatDeductible')}
              </div>

              <div className="field field-row">
                <div>{moneyField('adRatePercent', 'Werbeanzeigen', { suffix: '%', step: '0.1', placeholder: '0,0' })}</div>
                <div>{moneyField('shopDiscountPercent', 'Shop-Rabatt', { suffix: '%', step: '1', placeholder: '0' })}</div>
              </div>

              <div className="field">
                {moneyField('targetProfit', 'Zielgewinn je Verkauf', {
                  step: '1',
                  hint: 'Bestimmt den maximalen Einkaufspreis, der rechts ausgewiesen wird.',
                })}
              </div>
            </div>
          </details>

          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={reset}>
              Zurücksetzen
            </button>
          </div>
        </section>

        <ResultPanel
          result={calculation.result}
          maxPurchase={calculation.maxPurchase}
          breakEven={calculation.breakEven}
          targetProfit={parseNumber(form.targetProfit)}
        />
      </main>
    </div>
  );
}
