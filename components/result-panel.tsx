'use client';

import { useEffect, useState } from 'react';
import { RATES_EFFECTIVE_FROM } from '@/lib/fees/categories';
import type { CalculationResult } from '@/lib/fees/types';
import { formatCurrency, formatPercent } from '@/lib/format';

interface ResultPanelProps {
  result: CalculationResult;
  maxPurchase: number;
  breakEven: number;
  targetProfit: number;
}

const COMMISSION_BASIS_LABEL: Record<CalculationResult['fees']['commissionBasis'], string> = {
  reduced_condition: 'Reduzierter Satz für gebrauchte Ware',
  standard: 'Regulärer Kategoriesatz',
  tiered: 'Gestaffelt, ab 990 € nur 3 %',
};

const CONFIDENCE_NOTE: Record<CalculationResult['category']['confidence'], string | null> = {
  official: null,
  press:
    'Dieser Satz stammt aus Berichten zur Gebührenreform, nicht direkt aus eBays Gebührenübersicht.',
  unverified:
    'Für diese Kategorie widersprechen sich die vorliegenden Quellen. Vor einer Kaufentscheidung mit der eigenen eBay-Gebührenabrechnung abgleichen.',
};

function buildCopyText(
  { category, fees, profit }: CalculationResult,
  maxPurchase: number,
): string {
  return [
    'eBay Gebühren- & Gewinnrechner',
    '--------------------------------',
    `Kategorie: ${category.name}`,
    `Bemessungsgrundlage: ${formatCurrency(fees.grossTransactionAmount)}`,
    `Verkaufsprovision: ${formatPercent(fees.commissionPercent)} = ${formatCurrency(fees.commissionNet)}`,
    `Fixgebühr: ${formatCurrency(fees.fixedFeeNet)}`,
    `eBay-Gebühr netto: ${formatCurrency(fees.totalFeeNet)}`,
    `eBay-Gebühr brutto: ${formatCurrency(fees.totalFeeGross)}`,
    `Auszahlung: ${formatCurrency(fees.payout)}`,
    `USt an das Finanzamt: ${formatCurrency(profit.salesVat)}`,
    `Einkauf (netto): ${formatCurrency(profit.purchaseNet)}`,
    `Versand (netto): ${formatCurrency(profit.shippingNet)}`,
    `Gewinn: ${formatCurrency(profit.profit)}`,
    `Marge: ${formatPercent(profit.marginPercent)}`,
    `ROI: ${formatPercent(profit.roiPercent)}`,
    `Max. Einkaufspreis: ${formatCurrency(maxPurchase)}`,
  ].join('\n');
}

interface RowProps {
  term: string;
  note?: string;
  value: string;
  total?: boolean;
}

function Row({ term, note, value, total }: RowProps) {
  return (
    <div className={`ledger__row${total ? ' ledger__row--total' : ''}`}>
      <span className="ledger__term">
        {term}
        {note && <span className="ledger__note">{note}</span>}
      </span>
      <span className="ledger__value">{value}</span>
    </div>
  );
}

export function ResultPanel({ result, maxPurchase, breakEven, targetProfit }: ResultPanelProps) {
  const { category, fees, profit } = result;
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(''), 2400);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText(result, maxPurchase));
      setFeedback('Ergebnis kopiert');
    } catch {
      setFeedback('Kopieren nicht möglich – Berechtigung fehlt');
    }
  };

  // Ohne Verkaufspreis gäbe es nur die Fixgebühr auszuweisen – rechnerisch
  // richtig, aber als Startzustand irreführend. Dann lieber neutral bleiben.
  const isEmpty = fees.grossTransactionAmount <= 0;
  const isLoss = !isEmpty && profit.profit < 0;
  const otherCostsTotal = profit.shippingNet + profit.otherCostsNet;

  // Nenner so wählen, dass ein Verlust als eigenes Segment sichtbar wird,
  // statt wie bisher stillschweigend auf 0 geklemmt zu werden.
  const denominator = fees.grossTransactionAmount + (isLoss ? -profit.profit : 0);
  const share = (value: number) =>
    denominator > 0 ? `${Math.max((value / denominator) * 100, 0)}%` : '0%';

  const confidenceNote = CONFIDENCE_NOTE[category.confidence];

  return (
    <section className="panel result-panel" aria-labelledby="resultHeading">
      <h2 id="resultHeading" className="panel__heading">
        Ergebnis
      </h2>

      {confidenceNote && (
        <div className="notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
          </svg>
          <span>
            <strong>Gebührensatz ungeprüft.</strong> {confidenceNote}
          </span>
        </div>
      )}

      <div className="headline">
        <div className="headline__cell">
          <span className="headline__label">Gewinn nach Steuern</span>
          <span
            className={`headline__value ${
              isEmpty
                ? 'headline__value--neutral'
                : isLoss
                  ? 'headline__value--negative'
                  : 'headline__value--positive'
            }`}
          >
            {isEmpty ? formatCurrency(0) : formatCurrency(profit.profit)}
          </span>
          <span className="headline__note">
            {isEmpty
              ? 'Verkaufspreis eintragen'
              : `Marge ${formatPercent(profit.marginPercent)} · ROI ${formatPercent(profit.roiPercent)}`}
          </span>
        </div>
        <div className="headline__cell">
          <span className="headline__label">Auszahlung von eBay</span>
          <span className="headline__value headline__value--neutral">
            {isEmpty ? formatCurrency(0) : formatCurrency(fees.payout)}
          </span>
          <span className="headline__note">vor Steuern und eigenen Kosten</span>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi__label">Max. Einkaufspreis</span>
          <span className="kpi__value kpi__value--accent">
            {isEmpty ? '–' : formatCurrency(maxPurchase)}
          </span>
          <span className="kpi__hint">
            {targetProfit > 0
              ? `für ${formatCurrency(targetProfit)} Zielgewinn`
              : 'bevor der Verkauf defizitär wird'}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Break-even</span>
          <span className="kpi__value">
            {isEmpty || !Number.isFinite(breakEven) ? '–' : formatCurrency(breakEven)}
          </span>
          <span className="kpi__hint">Verkaufspreis ohne Gewinn</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">eBay-Gebühr</span>
          <span className={`kpi__value${isLoss ? ' kpi__value--negative' : ''}`}>
            {formatCurrency(fees.totalFeeGross)}
          </span>
          <span className="kpi__hint">
            {isEmpty ? 'brutto' : `${formatPercent(fees.commissionPercent)} + Fixgebühr`}
          </span>
        </div>
      </div>

      <div className="breakdown-bar" aria-hidden="true">
        <div className="breakdown-bar__segment breakdown-bar__segment--purchase" style={{ width: share(profit.purchaseNet) }} />
        <div className="breakdown-bar__segment breakdown-bar__segment--shipping" style={{ width: share(otherCostsTotal) }} />
        <div className="breakdown-bar__segment breakdown-bar__segment--fee" style={{ width: share(fees.totalFeeNet) }} />
        <div className="breakdown-bar__segment breakdown-bar__segment--vat" style={{ width: share(profit.salesVat) }} />
        <div
          className={`breakdown-bar__segment breakdown-bar__segment--${isLoss ? 'loss' : 'profit'}`}
          style={{ width: share(Math.abs(profit.profit)) }}
        />
      </div>
      <div className="breakdown-legend">
        <span><i className="dot dot--purchase" />Einkauf</span>
        <span><i className="dot dot--shipping" />Versand &amp; Sonstiges</span>
        <span><i className="dot dot--fee" />eBay-Gebühr</span>
        <span><i className="dot dot--vat" />Umsatzsteuer</span>
        <span><i className={`dot ${isLoss ? 'dot--loss' : 'dot--profit'}`} />{isLoss ? 'Verlust' : 'Gewinn'}</span>
      </div>

      <div className="ledger">
        <h3 className="ledger__heading">eBay-Gebühren</h3>
        <div className="ledger__list">
          <Row
            term="Bemessungsgrundlage"
            note="Artikelpreis + Versand, den der Käufer zahlt"
            value={formatCurrency(fees.grossTransactionAmount)}
          />
          <Row
            term={`Verkaufsprovision ${formatPercent(fees.commissionPercent)}`}
            note={COMMISSION_BASIS_LABEL[fees.commissionBasis]}
            value={formatCurrency(fees.commissionNet)}
          />
          <Row
            term="Fixgebühr"
            note={fees.grossTransactionAmount >= 10 ? 'ab 10 € Bestellwert' : 'unter 10 € Bestellwert'}
            value={formatCurrency(fees.fixedFeeNet)}
          />
          {fees.adFeeNet > 0 && <Row term="Werbeanzeigen" value={formatCurrency(fees.adFeeNet)} />}
          {fees.shopDiscountNet > 0 && (
            <Row term="Shop-Rabatt" value={`−${formatCurrency(fees.shopDiscountNet)}`} />
          )}
          <Row
            term="USt auf Gebühren"
            note="als Vorsteuer abziehbar"
            value={formatCurrency(fees.feeVat)}
          />
          <Row term="Gebühr brutto" value={formatCurrency(fees.totalFeeGross)} total />
        </div>
      </div>

      <div className="ledger">
        <h3 className="ledger__heading">Vom Erlös zum Gewinn</h3>
        <div className="ledger__list">
          <Row term="Auszahlung von eBay" value={formatCurrency(fees.payout)} />
          <Row
            term="Umsatzsteuer an das Finanzamt"
            note="19 % aus dem Bruttoverkaufspreis"
            value={`−${formatCurrency(profit.salesVat)}`}
          />
          <Row
            term="Einkauf"
            note={
              profit.purchaseVatDeducted > 0
                ? 'netto, Vorsteuer abgezogen'
                : 'ohne Vorsteuerabzug'
            }
            value={`−${formatCurrency(profit.purchaseNet)}`}
          />
          <Row term="Eigener Versand" value={`−${formatCurrency(profit.shippingNet)}`} />
          {profit.otherCostsNet > 0 && (
            <Row term="Sonstige Kosten" value={`−${formatCurrency(profit.otherCostsNet)}`} />
          )}
          <Row
            term="Vorsteuer auf Gebühren"
            note="von eBay berechnet, vom Finanzamt erstattet"
            value={`+${formatCurrency(fees.feeVat)}`}
          />
          <Row term="Gewinn" value={formatCurrency(isEmpty ? 0 : profit.profit)} total />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--primary" onClick={copyResult}>
          Ergebnis kopieren
        </button>
      </div>
      <p className={`copy-feedback${feedback ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {feedback}
      </p>

      <p className="hint">Gebührensätze auf Stand {RATES_EFFECTIVE_FROM}.</p>
    </section>
  );
}
