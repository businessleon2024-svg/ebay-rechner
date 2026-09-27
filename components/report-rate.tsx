'use client';

import { useState } from 'react';
import { OPERATOR } from '@/lib/site';
import type { CalculationResult } from '@/lib/fees/types';
import { formatCurrency, formatPercent, parseNumber } from '@/lib/format';

/**
 * Meldung eines abweichenden Gebührensatzes.
 *
 * Die Sätze der Unterkategorien veröffentlicht kein Marktplatz vollständig —
 * diese Lücke lässt sich durch Recherche allein nicht schließen. Wer eine echte
 * Abrechnung vor sich hat, weiß es besser als jede Quelle.
 *
 * Deshalb wird hier nicht nur „stimmt nicht" gemeldet, sondern die
 * tatsächlichen Werte erfasst. Erst damit ist eine Rückmeldung verwertbar: Aus
 * „12 % statt 14 % laut Abrechnung, Kategorie Spielzeug" wird eine Korrektur,
 * aus „stimmt irgendwie nicht" nichts.
 *
 * Versand per E-Mail statt über ein Formular auf dem Server: Es braucht keine
 * Infrastruktur, bei uns entstehen keine personenbezogenen Daten, und der
 * Absender behält die Nachricht im eigenen Postausgang.
 */

interface ReportForm {
  actualCommission: string;
  actualTotalGross: string;
  exactCategory: string;
  orderNumber: string;
  note: string;
}

const EMPTY: ReportForm = {
  actualCommission: '',
  actualTotalGross: '',
  exactCategory: '',
  orderNumber: '',
  note: '',
};

function buildMail(result: CalculationResult, form: ReportForm): string {
  const { marketplace, category, fees, condition, precision } = result;

  const gemeldet = [
    form.actualCommission && `  Verkaufsprovision: ${form.actualCommission} €`,
    form.actualTotalGross && `  Gesamtgebühr brutto: ${form.actualTotalGross} €`,
    form.exactCategory && `  Genaue Kategorie im Angebot: ${form.exactCategory}`,
    form.orderNumber && `  Bestellnummer: ${form.orderNumber}`,
  ].filter(Boolean);

  return [
    'Meine Abrechnung weicht vom Rechner ab.',
    '',
    '— Laut Abrechnung —',
    ...(gemeldet.length > 0 ? gemeldet : ['  (keine Angaben gemacht)']),
    ...(form.note ? ['', '— Anmerkung —', `  ${form.note}`] : []),
    '',
    '— Was der Rechner ausgegeben hat —',
    `  Marktplatz: ${marketplace.name}`,
    `  Kategorie: ${category.name} (${category.id})`,
    `  Artikelzustand: ${condition}`,
    `  Genauigkeit: ${precision}`,
    `  Gebührengrundlage: ${formatCurrency(fees.grossTransactionAmount)}`,
    `  Angesetzter Satz: ${formatPercent(fees.commissionPercent)} (${fees.commissionBasis})`,
    `  Verkaufsprovision: ${formatCurrency(fees.commissionNet)}`,
    `  Feste Verkaufsgebühr: ${formatCurrency(fees.fixedFeeNet)}`,
    `  Gebühr netto: ${formatCurrency(fees.totalFeeNet)}`,
    `  Gebühr brutto: ${formatCurrency(fees.totalFeeGross)}`,
  ].join('\n');
}

export function ReportRate({ result }: { result: CalculationResult }) {
  const [form, setForm] = useState<ReportForm>(EMPTY);

  if (!OPERATOR.email) return null;

  const set = <K extends keyof ReportForm>(key: K, value: ReportForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const { fees, marketplace } = result;

  // Sofortige Rückmeldung zur Abweichung: Wer sie beziffert sieht, merkt
  // schneller, ob er sich vertippt hat oder wirklich etwas nicht stimmt.
  const gemeldeteProvision = parseNumber(form.actualCommission);
  const abweichung =
    form.actualCommission.trim() !== '' ? gemeldeteProvision - fees.commissionNet : null;

  const betreff = `Abweichender Gebührensatz: ${marketplace.name} · ${result.category.name}`;
  const href = `mailto:${OPERATOR.email}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(buildMail(result, form))}`;

  const etwasAngegeben =
    form.actualCommission.trim() !== '' ||
    form.actualTotalGross.trim() !== '' ||
    form.exactCategory.trim() !== '';

  return (
    <details className="advanced report">
      <summary>Stimmt die Gebühr bei dir nicht?</summary>
      <div className="advanced__body">
        <p className="hint hint--standalone">
          Trag ein, was tatsächlich auf deiner Abrechnung steht. Je genauer, desto eher lässt sich
          der Satz korrigieren — am hilfreichsten ist die genaue Unterkategorie, denn die
          veröffentlichen die Marktplätze nicht.
        </p>

        <div className="field field-row">
          <div>
            <label htmlFor="actualCommission">Verkaufsprovision laut Abrechnung</label>
            <div className="input-wrap">
              <input
                id="actualCommission"
                className="input"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder={formatCurrency(fees.commissionNet).replace(/\s?€/, '')}
                autoComplete="off"
                value={form.actualCommission}
                onChange={(event) => set('actualCommission', event.target.value)}
              />
              <span className="input-suffix">€</span>
            </div>
          </div>
          <div>
            <label htmlFor="actualTotalGross">Gesamtgebühr brutto</label>
            <div className="input-wrap">
              <input
                id="actualTotalGross"
                className="input"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder={formatCurrency(fees.totalFeeGross).replace(/\s?€/, '')}
                autoComplete="off"
                value={form.actualTotalGross}
                onChange={(event) => set('actualTotalGross', event.target.value)}
              />
              <span className="input-suffix">€</span>
            </div>
          </div>
        </div>

        {abweichung !== null && (
          <p className={`report__delta${Math.abs(abweichung) < 0.01 ? ' is-match' : ''}`}>
            {Math.abs(abweichung) < 0.01
              ? 'Stimmt mit dem Rechner überein.'
              : `Abweichung: ${abweichung > 0 ? '+' : '−'}${formatCurrency(Math.abs(abweichung))} gegenüber ${formatCurrency(fees.commissionNet)} im Rechner.`}
          </p>
        )}

        <div className="field">
          <label htmlFor="exactCategory">Genaue Kategorie im Angebot</label>
          <div className="input-wrap">
            <input
              id="exactCategory"
              className="input"
              type="text"
              placeholder="z. B. Spielzeug &gt; Tonies"
              autoComplete="off"
              value={form.exactCategory}
              onChange={(event) => set('exactCategory', event.target.value)}
            />
          </div>
          <p className="hint">
            So, wie sie im Angebot steht — gern mit Unterkategorie. Das ist die wertvollste Angabe.
          </p>
        </div>

        <div className="field">
          <label htmlFor="orderNumber">Bestellnummer (freiwillig)</label>
          <div className="input-wrap">
            <input
              id="orderNumber"
              className="input"
              type="text"
              placeholder="11-15218-13403"
              autoComplete="off"
              value={form.orderNumber}
              onChange={(event) => set('orderNumber', event.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="reportNote">Anmerkung (freiwillig)</label>
          <textarea
            id="reportNote"
            className="input input--area"
            rows={3}
            placeholder="Shop-Abo, Aktion, internationale Lieferung …"
            value={form.note}
            onChange={(event) => set('note', event.target.value)}
          />
        </div>

        <div className="form-actions">
          <a
            className={`btn btn--primary${etwasAngegeben ? '' : ' is-disabled'}`}
            href={etwasAngegeben ? href : undefined}
            aria-disabled={!etwasAngegeben}
          >
            Rückmeldung per E-Mail
          </a>
        </div>
        <p className="hint">
          Öffnet dein E-Mail-Programm mit einer fertigen Nachricht. Die Berechnung ist darin bereits
          enthalten — du kannst alles vor dem Senden noch lesen und ändern.
        </p>
      </div>
    </details>
  );
}
