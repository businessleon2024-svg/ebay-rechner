'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { breakEvenSellPrice, calculate, maxPurchasePrice } from '@/lib/fees/calculate';
import { MARKETPLACES, requireMarketplace } from '@/lib/fees/marketplaces';
import { BELOW_STANDARD_SURCHARGE_PERCENT } from '@/lib/fees/ebay';
import type {
  FeeCalculationInput,
  FeeCategory,
  ItemCondition,
  MarketplaceId,
  TaxScheme,
} from '@/lib/fees/types';
import { parseNumber } from '@/lib/format';
import { EanLookup } from './ean-lookup';
import { ResultPanel } from './result-panel';

const STORAGE_KEY = 'ebayCalc.v3';
const DEFAULTS_KEY = 'ebayCalc.defaults.v1';

/**
 * Felder, die zum einzelnen Artikel gehören und deshalb beim Zurücksetzen
 * geleert werden. Alles Übrige beschreibt die Verkäufereinrichtung — Kategorie,
 * Zustand, Shop-Abo, wiederkehrende Gebühren — und bleibt als Standard erhalten.
 */
const ITEM_FIELDS = ['itemPrice', 'buyerShipping', 'purchase', 'shipping'] as const;

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

/** Besteuerungsformen mit kurzer Erläuterung für die Auswahl. */
const TAX_SCHEMES: ReadonlyArray<{ value: TaxScheme; label: string; hint: string }> = [
  {
    value: 'standard',
    label: 'Regelbesteuerung',
    hint: '19 % Umsatzsteuer aus dem Bruttoverkaufspreis, Vorsteuer abziehbar.',
  },
  {
    value: 'margin',
    label: 'Differenzbesteuerung (§ 25a)',
    hint: 'Umsatzsteuer nur auf die Spanne zwischen Verkauf und Einkauf. Für Gebrauchtware aus Privatankauf der Normalfall. Aus dem Einkauf ist dann keine Vorsteuer abziehbar.',
  },
  {
    value: 'small_business',
    label: 'Kleinunternehmer (§ 19)',
    hint: 'Keine Umsatzsteuer auf den Verkauf, dafür kein Vorsteuerabzug — die Marktplatzgebühren wirken brutto.',
  },
];

interface FormState {
  marketplaceId: MarketplaceId;
  taxScheme: TaxScheme;
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
  hasShopSubscription: boolean;
  belowStandardService: boolean;
  listingFee: string;
  optionsFee: string;
  internationalFee: string;
  currencyConversion: string;
}

const INITIAL_STATE: FormState = {
  marketplaceId: 'ebay',
  taxScheme: 'standard',
  categoryId: 'handys-kommunikation',
  condition: 'used',
  itemPrice: '',
  buyerShipping: '',
  purchase: '',
  // Passend zur voreingestellten Regelbesteuerung, siehe selectTaxScheme.
  purchaseVatDeductible: true,
  shipping: '',
  shippingVatDeductible: true,
  otherCosts: '',
  otherCostsVatDeductible: true,
  adRatePercent: '',
  shopDiscountPercent: '',
  targetProfit: '',
  monthlyPlanId: 'basic',
  ordersPerMonth: '',
  hasShopSubscription: false,
  belowStandardService: false,
  listingFee: '',
  optionsFee: '',
  internationalFee: '',
  currencyConversion: '',
};

function toCalculationInput(form: FormState): FeeCalculationInput {
  const marketplace = requireMarketplace(form.marketplaceId);
  const plan = marketplace.plans?.find((candidate) => candidate.id === form.monthlyPlanId);
  const ordersPerMonth = parseNumber(form.ordersPerMonth);

  return {
    marketplaceId: form.marketplaceId,
    taxScheme: form.taxScheme,
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
    hasShopSubscription: form.hasShopSubscription,
    belowStandardService: form.belowStandardService,
    listingFeeNet: parseNumber(form.listingFee),
    optionsFeeNet: parseNumber(form.optionsFee),
    internationalFeeNet: parseNumber(form.internationalFee),
    currencyConversionNet: parseNumber(form.currencyConversion),
    monthlyFee:
      plan && ordersPerMonth > 0
        ? { amountNet: plan.priceNet, ordersPerMonth }
        : undefined,
  };
}

/** Gespeicherte Standardeinstellungen, falls vorhanden. */
function readDefaults(): Partial<FormState> | null {
  try {
    const raw = window.localStorage.getItem(DEFAULTS_KEY);
    return raw ? (JSON.parse(raw) as Partial<FormState>) : null;
  } catch {
    window.localStorage.removeItem(DEFAULTS_KEY);
    return null;
  }
}

/** Kategorie, die nicht zum Marktplatz gehört, auf dessen Standard zurückholen. */
function withValidCategory(state: FormState): FormState {
  const marketplace = requireMarketplace(state.marketplaceId);
  const known = marketplace.categories.some((c) => c.id === state.categoryId);
  return known ? state : { ...state, categoryId: marketplace.defaultCategoryId };
}

function baseState(): FormState {
  return withValidCategory({ ...INITIAL_STATE, ...(readDefaults() ?? {}) });
}

/**
 * Zuletzt eingegebene Werte wiederherstellen, sonst die Standardeinstellungen.
 *
 * Läuft ausschließlich im Browser: die Komponente wird bewusst ohne SSR
 * eingebunden (siehe calculator-island.tsx), damit hier direkt aus dem
 * localStorage initialisiert werden kann, ohne Hydration-Mismatch.
 */
function restoreState(): FormState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return baseState();
    return withValidCategory({ ...baseState(), ...(JSON.parse(raw) as Partial<FormState>) });
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return baseState();
  }
}

export function Calculator() {
  const [form, setForm] = useState<FormState>(restoreState);
  const [hasDefaults, setHasDefaults] = useState(() => readDefaults() !== null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

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

  /**
   * Besteuerungsform wechseln und die davon abhängigen Schalter mitziehen.
   *
   * Wer regelbesteuert ist, kauft im Regelfall mit ausgewiesener Umsatzsteuer
   * ein und zieht sie als Vorsteuer ab — der Schalter gehört dann an. Bei
   * Differenzbesteuerung ist das Gegenteil der Fall, sie setzt einen Erwerb
   * ohne ausgewiesene Steuer voraus. Kleinunternehmer dürfen überhaupt keine
   * Vorsteuer ziehen.
   *
   * Die Schalter bleiben einzeln änderbar; hier wird nur der jeweils
   * typische Fall vorbelegt, statt ihn jedes Mal von Hand herstellen zu
   * lassen.
   */
  const selectTaxScheme = (taxScheme: TaxScheme) =>
    setForm((current) => ({
      ...current,
      taxScheme,
      purchaseVatDeductible: taxScheme === 'standard',
      shippingVatDeductible: taxScheme !== 'small_business',
      otherCostsVatDeductible: taxScheme !== 'small_business',
    }));

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

  /** Nur die artikelbezogenen Felder leeren, Einrichtung behalten. */
  const reset = () => {
    setForm((current) => {
      const cleared = { ...current };
      for (const field of ITEM_FIELDS) cleared[field] = '';
      return cleared;
    });
  };

  const saveDefaults = () => {
    // Die Preise des aktuellen Artikels gehören nicht in den Standard.
    const profile = { ...form };
    for (const field of ITEM_FIELDS) delete (profile as Partial<FormState>)[field];

    window.localStorage.setItem(DEFAULTS_KEY, JSON.stringify(profile));
    setHasDefaults(true);
    setNotice('Als Standard gespeichert');
  };

  const clearDefaults = () => {
    window.localStorage.removeItem(DEFAULTS_KEY);
    setHasDefaults(false);
    setNotice('Standard gelöscht');
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

  /**
   * Der Vorsteuer-Schalter erscheint nur, wo er etwas bewirkt: Kleinunternehmer
   * sind nie abzugsberechtigt, und bei der Differenzbesteuerung gilt das für
   * den Einkauf. Ein wirkungsloser Schalter wäre irreführend.
   */
  const vatToggle = (
    key: 'purchaseVatDeductible' | 'shippingVatDeductible' | 'otherCostsVatDeductible',
  ) => {
    if (form.taxScheme === 'small_business') return null;
    if (form.taxScheme === 'margin' && key === 'purchaseVatDeductible') return null;

    return (
      <label className="checkline">
        <input
          type="checkbox"
          checked={form[key]}
          onChange={(event) => update(key, event.target.checked)}
        />
        Rechnung mit ausgewiesener USt
      </label>
    );
  };

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
            <label htmlFor="taxSchemeSelect">Besteuerung</label>
            <div className="input-wrap">
              <select
                id="taxSchemeSelect"
                className="input"
                value={form.taxScheme}
                onChange={(event) => selectTaxScheme(event.target.value as TaxScheme)}
              >
                {TAX_SCHEMES.map((scheme) => (
                  <option key={scheme.value} value={scheme.value}>
                    {scheme.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="hint">
              {TAX_SCHEMES.find((scheme) => scheme.value === form.taxScheme)?.hint}
            </p>
          </div>

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
            <p className="hint">
              Hinterlegt sind die Hauptkategorien. <strong>Unterkategorien können abweichende
              Sätze haben</strong> — {marketplace.name} veröffentlicht sie nicht vollständig. Im
              Zweifel gilt die eigene Gebührenabrechnung.{' '}
              <Link className="linkbutton" href="/gebuehren">
                Alle Sätze ansehen
              </Link>
            </p>
          </div>

          {/*
            Nur bei eBay: Die Abfrage beruht auf eBay-Angeboten, für Kaufland
            gibt es keine entsprechende Quelle. Ohne hinterlegte Zugangsdaten
            blendet sich der Block selbst aus.
          */}
          {marketplace.id === 'ebay' && (
            <EanLookup
              gewaehlteKategorie={form.categoryId}
              aufKategorie={(categoryId) => update('categoryId', categoryId)}
            />
          )}

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

              {marketplace.id === 'ebay' && (
                <>
                  <div className="field">
                    <label className="checkline">
                      <input
                        type="checkbox"
                        checked={form.hasShopSubscription}
                        onChange={(event) => update('hasShopSubscription', event.target.checked)}
                      />
                      eBay-Shop vorhanden
                    </label>
                    <p className="hint">
                      Beeinflusst nur Gebührenregeln, bei denen eBay ausdrücklich zwischen Shop-
                      und Nicht-Shop-Verkäufern unterscheidet. Derzeit betrifft das allein Uhren
                      &amp; Schmuck, wo die Staffelgrenze von 990 € auf 500 € sinkt. Ein Shop
                      senkt die Verkaufsprovision nicht allgemein.
                    </p>
                  </div>

                  <div className="field">
                    <label className="checkline">
                      <input
                        type="checkbox"
                        checked={form.belowStandardService}
                        onChange={(event) => update('belowStandardService', event.target.checked)}
                      />
                      Servicestatus &bdquo;Unterdurchschnittlich&ldquo;
                    </label>
                    <p className="hint">
                      Schlägt {BELOW_STANDARD_SURCHARGE_PERCENT} % des Transaktionsbetrags
                      zusätzlich auf — die Position heißt auf der Abrechnung &bdquo;Erhöhte
                      Verkaufsprovision bei Servicestatus Unterdurchschnittlich&ldquo;. Sie kann die
                      Gebühr nahezu verdoppeln und ist die einzige, die sich durch eigenes Zutun
                      abstellen lässt.
                    </p>
                  </div>

                  <div className="field field-row">
                    <div>{moneyField('listingFee', 'Angebotsgebühr')}</div>
                    <div>{moneyField('optionsFee', 'Zusatzoptionen')}</div>
                  </div>
                  <div className="field field-row">
                    <div>{moneyField('internationalFee', 'Internationale Gebühr')}</div>
                    <div>{moneyField('currencyConversion', 'Währungsumrechnung')}</div>
                  </div>
                  <p className="hint">
                    Jeweils netto und nur eintragen, wenn sie tatsächlich anfallen. Sie lassen sich
                    nicht aus dem Verkaufspreis ableiten.
                  </p>
                </>
              )}

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
              Preise leeren
            </button>
            <button type="button" className="btn btn--ghost" onClick={saveDefaults}>
              Als Standard speichern
            </button>
          </div>
          <p className="hint">
            Der Standard merkt sich deine Einrichtung — Marktplatz, Kategorie, Artikelzustand,
            Shop-Abo und wiederkehrende Gebühren. „Preise leeren“ setzt nur Verkaufs-, Einkaufs-
            und Versandpreis zurück.
            {hasDefaults && (
              <>
                {' '}
                <button type="button" className="linkbutton" onClick={clearDefaults}>
                  Standard löschen
                </button>
              </>
            )}
          </p>
          <p className={`copy-feedback${notice ? ' is-visible' : ''}`} role="status" aria-live="polite">
            {notice}
          </p>
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
