'use client';

import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from '@/lib/fees/categories';
import { breakEvenSellPrice, calculate, maxPurchasePrice } from '@/lib/fees/calculate';
import type { FeeCalculationInput, ItemCondition } from '@/lib/fees/types';
import { parseNumber } from '@/lib/format';
import { ResultPanel } from './result-panel';

const STORAGE_KEY = 'ebayCalc.v2';

const CONDITIONS: ReadonlyArray<{ value: ItemCondition; label: string }> = [
  { value: 'new', label: 'Neu' },
  { value: 'used', label: 'Gebraucht' },
  { value: 'new_other', label: 'Neu: Sonstige' },
  { value: 'refurbished_certified', label: 'Zert. refurbished' },
  { value: 'refurbished_seller', label: 'Generalüberholt' },
];

interface FormState {
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
}

const INITIAL_STATE: FormState = {
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
};

function toCalculationInput(form: FormState): FeeCalculationInput {
  return {
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
    return { ...INITIAL_STATE, ...(JSON.parse(raw) as Partial<FormState>) };
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

  const calculation = useMemo(() => {
    const input = toCalculationInput(form);
    return {
      input,
      result: calculate(input),
      maxPurchase: maxPurchasePrice(input, parseNumber(form.targetProfit)),
      breakEven: breakEvenSellPrice(input),
    };
  }, [form]);

  const reset = () => {
    setForm(INITIAL_STATE);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const moneyField = (
    id: keyof FormState & string,
    label: string,
    options: { suffix?: string; step?: string; hint?: string } = {},
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
          placeholder="0,00"
          autoComplete="off"
          value={form[id] as string}
          onChange={(event) => update(id, event.target.value as FormState[typeof id])}
        />
        <span className="input-suffix">{options.suffix ?? '€'}</span>
      </div>
      {options.hint && <p className="hint">{options.hint}</p>}
    </>
  );

  const vatToggle = (key: 'purchaseVatDeductible' | 'shippingVatDeductible' | 'otherCostsVatDeductible') => (
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
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} · {category.standardPercent} %
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <span className="field__label">Artikelzustand</span>
          <div className="segmented" role="radiogroup" aria-label="Artikelzustand">
            {CONDITIONS.map((condition) => (
              <label
                key={condition.value}
                className={`segmented__option${form.condition === condition.value ? ' is-active' : ''}`}
              >
                <input
                  type="radio"
                  name="condition"
                  value={condition.value}
                  checked={form.condition === condition.value}
                  onChange={() => update('condition', condition.value)}
                />
                {condition.label}
              </label>
            ))}
          </div>
          <p className="hint">
            Seit 01.07.2026 kostet gebrauchte und generalüberholte Ware in vielen Kategorien nur
            noch 5 % statt bis zu 14 %.
          </p>
        </div>

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

        <details className="advanced">
          <summary>Weitere Kosten &amp; Zielgewinn</summary>
          <div className="advanced__body">
            <div className="field">
              {moneyField('otherCosts', 'Sonstige Kosten (Verpackung o. Ä.)')}
              {vatToggle('otherCostsVatDeductible')}
            </div>

            <div className="field field-row">
              <div>{moneyField('adRatePercent', 'Werbeanzeigen', { suffix: '%', step: '0.1' })}</div>
              <div>{moneyField('shopDiscountPercent', 'Shop-Rabatt', { suffix: '%', step: '1' })}</div>
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
  );
}
