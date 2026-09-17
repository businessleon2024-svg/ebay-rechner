'use client';

import { useEffect, useState } from 'react';
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
    'Dieser Satz stammt aus Berichten zur Gebührenreform, nicht direkt aus der offiziellen Gebührenübersicht.',
  unverified:
    'Für diese Kategorie widersprechen sich die vorliegenden Quellen. Vor einer Kaufentscheidung mit der eigenen Gebührenabrechnung abgleichen.',
};

function buildCopyText(
  { marketplace, category, fees, profit }: CalculationResult,
  maxPurchase: number,
): string {
  return [
    `Gebührenkompass · ${marketplace.name}`,
    '--------------------------------',
    `Kategorie: ${category.name}`,
    `Nettoerlös: ${formatCurrency(profit.revenueNet)}`,
    `${marketplace.name}-Gebühr (netto): ${formatCurrency(fees.totalFeeNet)}`,
    `Einkauf: ${formatCurrency(profit.purchaseNet)}`,
    `Versand: ${formatCurrency(profit.shippingNet)}`,
    `Gewinn: ${formatCurrency(profit.profit)}`,
    `Marge: ${formatPercent(profit.marginPercent)}`,
    `ROI: ${formatPercent(profit.roiPercent)}`,
    `Auszahlung: ${formatCurrency(fees.payout)}`,
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
  const { marketplace, category, fees, profit } = result;
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

  // Nenner so wählen, dass ein Verlust als eigenes Segment sichtbar wird.
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
          <span className="headline__label">Gewinn</span>
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
          <span className="headline__label">Auszahlung</span>
          <span className="headline__value headline__value--neutral">
            {isEmpty ? formatCurrency(0) : formatCurrency(fees.payout)}
          </span>
          <span className="headline__note">was {marketplace.name} überweist</span>
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
          <span className="kpi__label">{marketplace.name}-Gebühr</span>
          <span className="kpi__value">{formatCurrency(fees.totalFeeGross)}</span>
          <span className="kpi__hint">
            {isEmpty ? 'brutto' : `${formatPercent(fees.commissionPercent)} inkl. aller Gebühren`}
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
        <span><i className="dot dot--shipping" />Versand</span>
        <span><i className="dot dot--fee" />Gebühr</span>
        <span><i className="dot dot--vat" />Umsatzsteuer</span>
        <span><i className={`dot ${isLoss ? 'dot--loss' : 'dot--profit'}`} />{isLoss ? 'Verlust' : 'Gewinn'}</span>
      </div>

      {/*
        Bewusst durchgängig auf Nettobasis: Erlös ohne Umsatzsteuer, Gebühren
        ohne Vorsteuer. Sonst stünden Brutto- und Nettobeträge nebeneinander
        und die Rechnung wäre zwar richtig, aber nicht mehr nachvollziehbar.
      */}
      <div className="ledger">
        <div className="ledger__list">
          <Row
            term="Nettoerlös"
            note="Verkaufspreis ohne Umsatzsteuer"
            value={formatCurrency(profit.revenueNet)}
          />
          <Row
            term={`${marketplace.name}-Gebühr`}
            note="netto, ohne abziehbare Vorsteuer"
            value={`−${formatCurrency(fees.totalFeeNet)}`}
          />
          <Row
            term="Einkauf"
            note={profit.purchaseVatDeducted > 0 ? 'netto' : 'ohne Vorsteuerabzug'}
            value={`−${formatCurrency(profit.purchaseNet)}`}
          />
          <Row term="Versand" value={`−${formatCurrency(profit.shippingNet)}`} />
          {profit.otherCostsNet > 0 && (
            <Row term="Sonstige Kosten" value={`−${formatCurrency(profit.otherCostsNet)}`} />
          )}
          <Row term="Gewinn" value={formatCurrency(isEmpty ? 0 : profit.profit)} total />
        </div>
      </div>

      <details className="advanced">
        <summary>Gebühren und Umsatzsteuer im Detail</summary>
        <div className="advanced__body">
          <div className="ledger">
            <h3 className="ledger__heading">Gebühren</h3>
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
              {fees.fixedFeeNet > 0 && (
                <Row
                  term="Fixgebühr"
                  note={
                    marketplace.id === 'ebay'
                      ? fees.grossTransactionAmount >= 10
                        ? 'ab 10 € Bestellwert'
                        : 'unter 10 € Bestellwert'
                      : 'je Artikel'
                  }
                  value={formatCurrency(fees.fixedFeeNet)}
                />
              )}
              {fees.monthlyFeeShareNet > 0 && (
                <Row
                  term="Anteil Grundgebühr"
                  note="monatliche Gebühr auf diesen Verkauf umgelegt"
                  value={formatCurrency(fees.monthlyFeeShareNet)}
                />
              )}
              {fees.adFeeNet > 0 && <Row term="Werbeanzeigen" value={formatCurrency(fees.adFeeNet)} />}
              {fees.shopDiscountNet > 0 && (
                <Row term="Shop-Rabatt" value={`−${formatCurrency(fees.shopDiscountNet)}`} />
              )}
              <Row term="Gebühr netto" value={formatCurrency(fees.totalFeeNet)} total />
              <Row
                term="USt auf Gebühren"
                note="als Vorsteuer abziehbar, daher kein echter Kostenfaktor"
                value={formatCurrency(fees.feeVat)}
              />
              <Row
                term="Gebühr brutto"
                note="so steht sie auf der Abrechnung"
                value={formatCurrency(fees.totalFeeGross)}
              />
            </div>
          </div>

          <div className="ledger">
            <h3 className="ledger__heading">Umsatzsteuer</h3>
            <div className="ledger__list">
              <Row
                term="Verkauf brutto"
                value={formatCurrency(fees.grossTransactionAmount)}
              />
              <Row
                term="USt an das Finanzamt"
                note="19 % aus dem Bruttoverkaufspreis"
                value={`−${formatCurrency(profit.salesVat)}`}
              />
              <Row term="Nettoerlös" value={formatCurrency(profit.revenueNet)} total />
              {profit.inputVatDeducted > 0 && (
                <Row
                  term="Vorsteuer aus eigenen Kosten"
                  note="vom Finanzamt erstattet"
                  value={formatCurrency(profit.inputVatDeducted)}
                />
              )}
            </div>
          </div>
        </div>
      </details>

      <div className="form-actions">
        <button type="button" className="btn btn--primary" onClick={copyResult}>
          Ergebnis kopieren
        </button>
      </div>
      <p className={`copy-feedback${feedback ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {feedback}
      </p>

      <p className="hint">
        {marketplace.name}-Gebührensätze auf Stand {marketplace.ratesEffectiveFrom}.
      </p>
    </section>
  );
}
