'use client';

import { OPERATOR } from '@/lib/site';
import type { CalculationResult } from '@/lib/fees/types';
import { formatCurrency, formatPercent } from '@/lib/format';

/**
 * Meldung eines abweichenden Gebührensatzes.
 *
 * Die Sätze der Unterkategorien veröffentlicht kein Marktplatz vollständig —
 * die Lücke lässt sich allein durch Recherche nicht schließen. Wer eine echte
 * Abrechnung vor sich hat, weiß es besser als jede Quelle. Deshalb wird der
 * gesamte Rechenweg in die Nachricht vorbereitet: Ohne Tippen steigt die
 * Wahrscheinlichkeit erheblich, dass eine Rückmeldung tatsächlich kommt.
 *
 * Bewusst per E-Mail statt über ein Formular: Es braucht keinen Server, es
 * entstehen keine personenbezogenen Daten bei uns, und der Absender behält
 * die Nachricht im eigenen Postausgang.
 */
export function ReportRate({ result }: { result: CalculationResult }) {
  if (!OPERATOR.email) return null;

  const { marketplace, category, fees, condition } = result;

  const betreff = `Abweichender Gebührensatz: ${marketplace.name} · ${category.name}`;

  const text = [
    'Bei mir weicht die tatsächliche Gebühr vom Rechner ab.',
    '',
    'Bitte hier eintragen:',
    '  Tatsächliche Gebühr laut Abrechnung: ',
    '  Genaue Kategorie im Angebot: ',
    '',
    '— Berechnung, die abweicht —',
    `Marktplatz: ${marketplace.name}`,
    `Kategorie: ${category.name}`,
    `Artikelzustand: ${condition}`,
    `Gebührengrundlage: ${formatCurrency(fees.grossTransactionAmount)}`,
    `Angesetzter Satz: ${formatPercent(fees.commissionPercent)}`,
    `Verkaufsprovision: ${formatCurrency(fees.commissionNet)}`,
    `Feste Verkaufsgebühr: ${formatCurrency(fees.fixedFeeNet)}`,
    `Gebühr netto: ${formatCurrency(fees.totalFeeNet)}`,
    `Gebühr brutto: ${formatCurrency(fees.totalFeeGross)}`,
  ].join('\n');

  const href = `mailto:${OPERATOR.email}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;

  return (
    <p className="report-rate">
      <a href={href}>Stimmt die Gebühr bei dir nicht?</a> Schreib uns — die Berechnung ist in der
      Nachricht schon enthalten, du ergänzt nur den echten Betrag.
    </p>
  );
}
