'use client';

import { useState } from 'react';
import { OPERATOR } from '@/lib/site';
import type { CalculationResult } from '@/lib/fees/types';
import { formatCurrency, formatPercent, parseNumber } from '@/lib/format';

/**
 * Meldung abweichender Gebührensätze.
 *
 * Die Sätze der Unterkategorien veröffentlicht kein Marktplatz. Kein noch so
 * gründlicher Rechner kann sie deshalb aus öffentlichen Quellen ableiten — die
 * einzige verlässliche Quelle sind echte Abrechnungen. Genau das ist der Zweck
 * dieses Formulars: aus vielen Einzelmeldungen eine Datengrundlage aufzubauen,
 * die es sonst nirgends gibt.
 *
 * Damit das trägt, muss eine Meldung zwei Dinge liefern: den tatsächlichen
 * Satz **und** eine eindeutige Kennung des Artikels. Ohne Produktkennung lässt
 * sich später nicht mehr nachvollziehen, welche Unterkategorie gemeint war —
 * die Meldung wäre dann wertlos.
 *
 * Die Nachricht ist bewusst maschinenlesbar aufgebaut (feste Schlüssel, eine
 * Angabe pro Zeile). So lassen sich eingehende Meldungen später automatisch
 * auswerten, ohne dass das Format nachträglich geändert werden müsste.
 */

const REPORT_FORMAT_VERSION = 1;

interface ReportForm {
  actualPercent: string;
  actualCommission: string;
  actualTotalGross: string;
  exactCategory: string;
  productName: string;
  ean: string;
  itemNumber: string;
  orderNumber: string;
  note: string;
}

const EMPTY: ReportForm = {
  actualPercent: '',
  actualCommission: '',
  actualTotalGross: '',
  exactCategory: '',
  productName: '',
  ean: '',
  itemNumber: '',
  orderNumber: '',
  note: '',
};

/** Nur gefüllte Angaben aufnehmen – leere Zeilen erschweren die Auswertung. */
function line(key: string, value: string | number | undefined): string | null {
  if (value === undefined || value === '' || value === null) return null;
  return `${key}: ${value}`;
}

function buildMail(result: CalculationResult, form: ReportForm): string {
  const { marketplace, category, fees, condition, precision } = result;

  const felder = [
    line('marktplatz', marketplace.id),
    line('kategorie_gewaehlt', category.id),
    line('kategorie_angebot', form.exactCategory.trim()),
    line('zustand', condition),
    line('genauigkeit', precision),
    line('grundlage', fees.grossTransactionAmount),
    line('satz_gerechnet', fees.commissionPercent),
    line('satz_tatsaechlich', form.actualPercent.trim()),
    line('provision_gerechnet', fees.commissionNet),
    line('provision_tatsaechlich', form.actualCommission.trim()),
    line('gebuehr_brutto_gerechnet', fees.totalFeeGross),
    line('gebuehr_brutto_tatsaechlich', form.actualTotalGross.trim()),
    line('produkt', form.productName.trim()),
    line('ean', form.ean.trim()),
    line('artikelnummer', form.itemNumber.trim()),
    line('bestellnummer', form.orderNumber.trim()),
    line('anmerkung', form.note.trim().replace(/\n+/g, ' ')),
  ].filter((entry): entry is string => entry !== null);

  return [
    'Meine Abrechnung weicht vom Rechner ab. Die Angaben unten stammen aus der',
    'tatsächlichen Gebührenabrechnung.',
    '',
    `--- GEBUEHRENKOMPASS-MELDUNG v${REPORT_FORMAT_VERSION} ---`,
    ...felder,
    '--- ENDE ---',
  ].join('\n');
}

export function ReportRate({ result }: { result: CalculationResult }) {
  const [form, setForm] = useState<ReportForm>(EMPTY);

  if (!OPERATOR.email) return null;

  const set = <K extends keyof ReportForm>(key: K, value: ReportForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const { fees, marketplace } = result;

  // Sofortige Rückmeldung zur Abweichung: Wer sie beziffert sieht, erkennt
  // schneller, ob er sich vertippt hat oder wirklich etwas nicht stimmt.
  const gemeldeteProvision = parseNumber(form.actualCommission);
  const abweichung =
    form.actualCommission.trim() !== '' ? gemeldeteProvision - fees.commissionNet : null;

  // Eine Meldung ist nur verwertbar, wenn sie einen tatsächlichen Wert nennt
  // und sich der Artikel später zuordnen lässt.
  const hatWert =
    form.actualPercent.trim() !== '' ||
    form.actualCommission.trim() !== '' ||
    form.actualTotalGross.trim() !== '';
  const hatKennung =
    form.exactCategory.trim() !== '' ||
    form.productName.trim() !== '' ||
    form.ean.trim() !== '' ||
    form.itemNumber.trim() !== '';
  const verwertbar = hatWert && hatKennung;

  const betreff = `Gebührenmeldung: ${marketplace.name} · ${result.category.name}`;
  const href = `mailto:${OPERATOR.email}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(buildMail(result, form))}`;

  const feld = (
    id: keyof ReportForm & string,
    label: string,
    options: { placeholder?: string; suffix?: string; type?: string; step?: string } = {},
  ) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          className="input"
          type={options.type ?? 'text'}
          inputMode={options.type === 'number' ? 'decimal' : undefined}
          step={options.step}
          min={options.type === 'number' ? '0' : undefined}
          placeholder={options.placeholder}
          autoComplete="off"
          value={form[id]}
          onChange={(event) => set(id, event.target.value)}
        />
        {options.suffix && <span className="input-suffix">{options.suffix}</span>}
      </div>
    </div>
  );

  return (
    <details className="advanced report">
      <summary>Gebühr weicht ab? Hilf mit, den Rechner genauer zu machen</summary>
      <div className="advanced__body">
        <p className="hint hint--standalone">
          eBay und Kaufland veröffentlichen ihre Sätze nicht für jede Unterkategorie. Kein Rechner
          kann sie deshalb vollständig kennen — <strong>echte Abrechnungen sind die einzige
          verlässliche Quelle</strong>. Je mehr Meldungen zusammenkommen, desto genauer wird der
          Rechner für alle.
        </p>

        <h3 className="report__heading">Was stand auf der Abrechnung?</h3>
        <div className="field field-row">
          {feld('actualPercent', 'Prozentsatz', {
            type: 'number',
            step: '0.1',
            suffix: '%',
            placeholder: formatPercent(fees.commissionPercent).replace(/\s?%/, ''),
          })}
          {feld('actualCommission', 'Verkaufsprovision', {
            type: 'number',
            step: '0.01',
            suffix: '€',
            placeholder: formatCurrency(fees.commissionNet).replace(/\s?€/, ''),
          })}
        </div>

        {abweichung !== null && (
          <p className={`report__delta${Math.abs(abweichung) < 0.01 ? ' is-match' : ''}`}>
            {Math.abs(abweichung) < 0.01
              ? 'Stimmt mit dem Rechner überein.'
              : `Abweichung: ${abweichung > 0 ? '+' : '−'}${formatCurrency(Math.abs(abweichung))} gegenüber ${formatCurrency(fees.commissionNet)} im Rechner.`}
          </p>
        )}

        <div className="field field-row">
          {feld('actualTotalGross', 'Gesamtgebühr brutto', {
            type: 'number',
            step: '0.01',
            suffix: '€',
            placeholder: formatCurrency(fees.totalFeeGross).replace(/\s?€/, ''),
          })}
          {feld('exactCategory', 'Kategorie im Angebot', {
            placeholder: 'Spielzeug › Tonies',
          })}
        </div>

        <h3 className="report__heading">Um welchen Artikel ging es?</h3>
        <p className="hint hint--standalone">
          Ohne Artikelkennung lässt sich später nicht mehr nachvollziehen, welche Unterkategorie
          gemeint war. Eine Angabe genügt — die Artikelnummer ist am eindeutigsten.
        </p>

        <div className="field">{feld('productName', 'Produktname', { placeholder: 'Logitech MX Brio Webcam' })}</div>

        <div className="field field-row">
          {feld('ean', 'EAN / GTIN', { placeholder: '4251192110466' })}
          {feld('itemNumber', 'Artikelnummer', { placeholder: '820175879319' })}
        </div>

        <div className="field field-row">
          {feld('orderNumber', 'Bestellnummer (freiwillig)', { placeholder: '11-15218-13403' })}
        </div>

        <div className="field">
          <label htmlFor="note">Anmerkung (freiwillig)</label>
          <textarea
            id="note"
            className="input input--area"
            rows={3}
            placeholder="Shop-Abo, Aktion, internationale Lieferung …"
            value={form.note}
            onChange={(event) => set('note', event.target.value)}
          />
        </div>

        <div className="form-actions">
          <a
            className={`btn btn--primary${verwertbar ? '' : ' is-disabled'}`}
            href={verwertbar ? href : undefined}
            aria-disabled={!verwertbar}
          >
            Meldung senden
          </a>
        </div>
        <p className="hint">
          {verwertbar
            ? 'Öffnet dein E-Mail-Programm mit einer fertigen Nachricht. Du kannst alles vor dem Senden lesen und ändern.'
            : 'Bitte einen tatsächlichen Wert und eine Angabe zum Artikel eintragen — sonst lässt sich die Meldung später nicht zuordnen.'}
        </p>
      </div>
    </details>
  );
}
