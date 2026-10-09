import type { Metadata } from 'next';
import Link from 'next/link';
import { AdSlot } from '@/components/ad-slot';
import { CalculatorIsland } from '@/components/calculator-island';
import { EmbedMode } from '@/components/embed-mode';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { JsonLd, calculatorSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Gebühren- & Gewinnrechner für eBay und Kaufland',
  description:
    'Gebühren, Auszahlung, Gewinn und Marge für gewerbliche Verkäufer berechnen – für eBay und Kaufland, inklusive Umsatzsteuer.',
  alternates: { canonical: '/rechner' },
};

/*
  Der Rechner selbst wird erst im Browser aufgebaut, damit er die zuletzt
  eingegebenen Werte wiederherstellen kann. Für Suchmaschinen wäre die Seite
  damit leer. Die folgenden Abschnitte werden serverseitig gerendert und
  erklären die drei Punkte, an denen Verkäufer sich regelmäßig verrechnen —
  sie stehen hier, weil sie Leser brauchen, nicht als Suchmaschinenfüllung.
*/
const STOLPERSTEINE = [
  {
    titel: 'Die Provision gilt auf alles, nicht nur auf den Artikelpreis',
    text: 'Bemessungsgrundlage ist der gesamte Transaktionsbetrag: Artikelpreis, Versandkosten und Umsatzsteuer zusammen. Wer 20 € Versand kassiert, zahlt auch darauf Provision. Genau deshalb hat der Rechner ein eigenes Feld für den Versand, den der Käufer bezahlt.',
  },
  {
    titel: 'Unterkategorien werden oft anders abgerechnet',
    text: 'Ein Arbeitsspeicher unter „Computer, Tablets & Netzwerk“ kostet 7 % Provision, eine Webcam in derselben Hauptkategorie 12 %. Auf der Abrechnung steht beide Male derselbe Kategoriename. Wo so ein Fall bekannt ist, steht im Rechner ein Hinweis unter der Kategorieauswahl.',
  },
  {
    titel: 'Die Besteuerungsart entscheidet mit',
    text: 'Bei Regelbesteuerung ist die Gebühr netto der echte Kostenfaktor, weil die Umsatzsteuer als Vorsteuer zurückkommt. Bei der Kleinunternehmerregelung zahlst du die Bruttogebühr. Bei Differenzbesteuerung nach § 25a fällt Umsatzsteuer nur auf die Marge an, dafür gibt es keinen Vorsteuerabzug aus dem Einkauf. Der Rechner stellt die Schalter passend zur Auswahl.',
  },
];

export default function RechnerPage() {
  return (
    <>
      <JsonLd data={calculatorSchema()} />
      {/* Blendet Kopfzeile, Fußzeile und Erklärtexte aus, wenn die
          Erweiterung den Rechner mit `?ext=1` in ihr Panel lädt. */}
      <EmbedMode />
      <SiteHeader />
      <CalculatorIsland />

      <div className="layout layout--single">
        <AdSlot />
      </div>

      <section className="section" aria-labelledby="stolpersteine-heading">
        <h2 className="section__heading" id="stolpersteine-heading">
          Woran sich die meisten verrechnen
        </h2>
        <p className="section__lead">
          Die Gebühr selbst ist nicht das Schwierige — die Bemessungsgrundlage ist es. Drei Punkte
          führen fast immer zu einer zu niedrig geschätzten Gebühr.
        </p>
        <div className="faq">
          {STOLPERSTEINE.map((eintrag) => (
            <div className="faq__item" key={eintrag.titel}>
              <h3 className="faq__question">{eintrag.titel}</h3>
              <p className="faq__answer">{eintrag.text}</p>
            </div>
          ))}
        </div>
        <p className="section__note">
          Alle hinterlegten Sätze stehen in der{' '}
          <Link href="/gebuehren">Gebührenübersicht</Link>. Weicht deine Abrechnung ab, melde die
          tatsächlichen Werte über das Formular unter dem Ergebnis — damit wird der Rechner für
          alle genauer.
        </p>
      </section>

      <SiteFooter />
    </>
  );
}
