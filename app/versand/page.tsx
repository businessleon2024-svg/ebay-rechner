import type { Metadata } from 'next';
import Link from 'next/link';
import { ShippingIsland } from '@/components/shipping-island';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { BELEGE, PREISSTAND } from '@/lib/shipping/dhl';

export const metadata: Metadata = {
  title: 'DHL-Versandkosten für Geschäftskunden berechnen',
  description:
    'Was kostet ein DHL-Paket im Geschäftskundentarif? Gewicht eintragen, Preis mit Maut- und Energiezuschlag sehen — abgelesen aus echten Rechnungen.',
  alternates: { canonical: '/versand' },
};

const FRAGEN = [
  {
    frage: 'Woher stammen diese Preise?',
    antwort: `Aus ${BELEGE} echten DHL-Rechnungen von September 2025 bis Oktober 2026 — nicht aus einer Preisliste und nicht geschätzt. Jede Position „DHL PAKET (GK) … kg“ wurde ausgewertet und durch die Stückzahl geteilt. Dabei fiel auch ein Preiswechsel zum Jahreswechsel auf: Die 1-kg-Stufe kostete bis Dezember 2025 noch 5,05 €, seit Januar 2026 sind es 5,00 €. Hinterlegt ist der aktuelle Stand (${PREISSTAND}).`,
  },
  {
    frage: 'Gelten die Preise auch für mich?',
    antwort:
      'Das sind die Konditionen eines einzelnen Geschäftskundenvertrags. Bei höherer Menge verhandelt DHL andere Staffeln, und andere Anbieter rechnen ohnehin anders. Nimm die Zahlen als Orientierung, nicht als Zusage — und trag unter „Eigene Vertragspreise hinterlegen“ deine echten ein, wenn du genau rechnen willst.',
  },
  {
    frage: 'Warum frage ich nicht nach Päckchen S oder M?',
    antwort:
      'Weil es die im Geschäftskundentarif nicht gibt. Dort zählt allein das Gewicht; ob der Karton klein oder groß ist, ändert am Preis nichts. Erst wenn eine Kante über 120 × 60 × 60 cm hinausgeht, kommt ein Übergrößen-Zuschlag dazu.',
  },
  {
    frage: 'Welche Zuschläge sind enthalten?',
    antwort:
      'Der Maut- und CO2-Zuschlag (fest 0,19 € je Sendung) und der Energiezuschlag (1,25 % vom Grundpreis). Beide stehen auf jeder Rechnung und sind eingerechnet. Nicht enthalten: der Peakzuschlag im November und Dezember (0,19–0,50 € je Sendung), das Codierentgelt bei unleserlicher Adresse (0,49 €) und der Übergrößen-Zuschlag — der kommt in den ausgewerteten Rechnungen nicht vor, deshalb wird er hier nicht beziffert.',
  },
  {
    frage: 'Netto oder brutto?',
    antwort:
      'Alle Beträge sind netto, so wie sie auf der Rechnung stehen. Als Regelbesteuerter ist das der richtige Wert für deine Kalkulation, weil die Umsatzsteuer als Vorsteuer zurückkommt. Als Kleinunternehmer rechne 19 % dazu.',
  },
];

export default function VersandPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero hero--compact">
          <h1 className="hero__title">Was kostet dein DHL-Paket wirklich?</h1>
          <p className="hero__subtitle">
            Gewicht eintragen, fertig. Inklusive Maut- und Energiezuschlag — abgelesen aus{' '}
            {BELEGE} echten Geschäftskunden-Rechnungen, nicht geschätzt.
          </p>
        </section>

        <ShippingIsland />

        <section className="section" aria-labelledby="versand-faq">
          <h2 className="section__heading" id="versand-faq">
            Wissenswertes zum Versand
          </h2>
          <div className="faq">
            {FRAGEN.map((eintrag) => (
              <div className="faq__item" key={eintrag.frage}>
                <h3 className="faq__question">{eintrag.frage}</h3>
                <p className="faq__answer">{eintrag.antwort}</p>
              </div>
            ))}
          </div>
          <p className="section__note">
            Das Porto gehört in die Gewinnrechnung: Trag den ermittelten Betrag im{' '}
            <Link href="/rechner">Gebührenrechner</Link> unter „Eigene Versandkosten“ ein, dann
            siehst du, was nach Gebühren und Porto übrig bleibt.
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
